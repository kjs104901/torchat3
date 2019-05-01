const fs = require('fs');
const crypto = require("crypto");
const net = require('net');
const child_process = require('child_process');

const config = require('../config');
const constant = require('../constant');
const parser = require('../core/parser');

const ed = require('ed25519-supercop');
const { SHA3 } = require('sha3');
const base32 = require("base32.js");

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

const torDir = __dirname + "/bin";
const secretKeyDir = torDir + "/hidden_service/secretKey";
const publicKeyDir = torDir + "/hidden_service/publicKey";


// ############################ tor ############################ //
let torProcess = null;

let bootProcess = 0;
let bootSuccess = false;
let bootError = false;
let bootLogs = [];

let keyPair = null;
let hostname = null;

let socksPort;

exports.start = () => {
    const controlPassword = generateControlPassword();
    keyPair = generateKeyPair();
    hostname = generateHostname(keyPair);
    console.log("hostname: ", hostname);

    if (!controlPassword) { eventEmitter.emit("fail"); return; }
    if (!keyPair) { eventEmitter.emit("fail"); return; }
    if (!hostname) { eventEmitter.emit("fail"); return; }

    makeTorrc(controlPassword);
    deleteControlFile();
    startTorProcess();
    checkControlFile()
        .then(() => {
            controlStart(controlPassword, keyPair);
        })

    checkBootProcess()
        .then(() => {
            eventEmitter.emit("success");
        })
        .catch(() => {
            eventEmitter.emit("fail");
        })
}

exports.getProgress = () => { return bootProcess; }
exports.getBootLogs = () => { return bootLogs; }

exports.getSuccess = () => { return bootSuccess; }
exports.getFail = () => { return bootError; }

exports.getKeyPair = () => { return keyPair; }
exports.getHostname = () => { return hostname; }


// ############################ utilities ############################ //
function makeTorrc(controlPassword) {
    let bridgeLine = '';
    if (config.getSetting().bridge == 1) { bridgeLine = "Bridge " + config.getSetting().bridge; }

    fs.writeFileSync(__dirname + '/torrc',
        `
SocksPort auto
ControlPort auto
ControlPortWriteToFile ${torDir}/data/controlPort
HashedControlPassword ${controlPassword.hashed}

UseBridges ${config.getSetting().useBridge ? '1' : '0'}
${bridgeLine}

DataDirectory ${torDir}/data
    ` + config.getSetting().torrcExpand);
}

function generateControlPassword() {
    const controlPassword = crypto.randomBytes(20).toString('hex');
    let controlPasswordHashed;

    const execString = child_process.execFileSync(torDir + '/tor.exe',
        ['--hash-password', controlPassword],
        { cwd: torDir, encoding: 'utf8' });

    if (execString.length <= 0) { return; }
    const execList = execString.split('\n');
    execList.forEach(line => {
        if (line.indexOf('16:') == 0) {
            controlPasswordHashed = line.replace('\r', '');
        }
    });
    if (!controlPasswordHashed) { return; }

    return {
        string: controlPassword,
        hashed: controlPasswordHashed
    };
}

function deleteControlFile() {
    if (fs.existsSync(controlPortFile)) {
        fs.unlinkSync(controlPortFile);
    }
}

function checkControlFile() {
    return new Promise((resolve, reject) => {
        const controlPortFileIntv = setInterval(() => {
            if (fs.existsSync(controlPortFile)) {
                clearInterval(controlPortFileIntv);
                resolve();
            }
        }, 100);
    })
}

function generateKeyPair() {
    let secret, public;
    if (fs.existsSync(secretKeyDir) && fs.existsSync(publicKeyDir)) { // already exists
        secret = fs.readFileSync(secretKeyDir);
        public = fs.readFileSync(publicKeyDir);
        return { secret, public }
    }
    else {
        const keyPair = ed.createKeyPair(Buffer.alloc(32, crypto.randomBytes(32)));
        secret = keyPair.secretKey;
        public = keyPair.publicKey;
        fs.writeFileSync(secretKeyDir, secret);
        fs.writeFileSync(publicKeyDir, public);
        return { secret, public }
    }
}

function generateHostname(keyPair) {
    const publicKey = keyPair.public;

    const salt = Buffer.alloc(".onion checksum".length, ".onion checksum");
    const version = Buffer.alloc(1, 3);

    const hash = new SHA3(256);
    hash.update(Buffer.concat([salt, publicKey, version]));
    const checksum = hash.digest().slice(0, 2);

    const base32Encoder = new base32.Encoder({ type: "rfc4648", lc: true });
    return base32Encoder.write(Buffer.concat([publicKey, checksum, version])).finalize();
}

function startTorProcess() {
    torProcess = child_process.spawn(torDir + '/tor.exe', ['-f', __dirname + '/torrc'], { cwd: torDir });

    torProcess.stdout.on('data', (data) => { pushLog(data); });
    torProcess.stderr.on('data', (data) => { pushLog(data); });

    torProcess.on('exit', (code) => {
        torProcess = null;
        controlDisconnect(true);
    });
}

function pushLog(data) {
    const line = data.toString();
    console.log(line);
    bootLogs.push(line);
    eventEmitter.emit("update");
    const percentStr = parser.findStringBetween(line, 'Bootstrapped ', '%');
    if (percentStr) {
        const percent = percentStr * 1
        if (0 < percent && bootProcess != percent) {
            bootProcess = percent;
            eventEmitter.emit("update");
        }
    }
}


function checkBootProcess() {
    return new Promise((resolve, reject) => {
        const bootIntv = setInterval(() => {
            controlCheckBootstrap();
            if (bootError) {
                clearInterval(bootIntv);
                reject();
            }
            else if (bootProcess >= 100 && socksPort) {
                clearInterval(bootIntv);
                config.setProxyPort(socksPort);
                bootSuccess = true;
                resolve();
            }
        }, 100);
    })
}


// ############################ tor control ############################ //
let controlConnection = null;
let controlAuth = false;
let controlHiddenService = false;
let controlHiddenServiceDestroy = false;
const controlPortFile = torDir + "/data/controlPort";

function controlStart(controlPassword, keyPair) {
    let controlPort;
    const constrolPortStr = fs.readFileSync(controlPortFile, { encoding: 'utf8' });
    if (constrolPortStr && constrolPortStr.split) {
        controlPort = ((constrolPortStr.split('\n'))[0]).replace('\r', '').substr(constrolPortStr.indexOf(':') + 1) * 1;
    }
    if (!controlPort) { bootError = true; return; }

    controlConnection = net.connect({ host: "127.0.0.1", port: controlPort });

    controlConnection.once('connect', () => {
        controlConnection.write('AUTHENTICATE "' + controlPassword.string + '" \r\n');
    })

    controlConnection.once('error', (err) => {
        if (err) {
            console.log(err);
            bootError = true;
        }
    });

    controlConnection.once('end', () => {
        controlConnection = null;
        controlAuth = false;
        controlHiddenService = null;
    })

    controlConnection.on('data', (data) => {
        data = data.toString();

        const lines = data.split('\r\n');
        lines.forEach(line => {
            if (line.length == 0) { return; }

            if (!controlAuth || controlHiddenServiceDestroy) {
                if (line.substr(0, 6) === '250 OK') {
                    controlAuth = true;
                    const secretKeySerial = keyPair.secret.toString('base64')
                    console.log(secretKeySerial);

                    controlConnection.write(
                        `ADD_ONION ED25519-V3:${secretKeySerial} ` +
                        `Flags=DiscardPK,Detach ` +
                        `Port=${constant.ServiceInsidePort},127.0.0.1:${config.getServicePort()} \r\n`
                    );
                }
            }
            else if (!controlHiddenService) {
                if (line.substr(0, 3) === '250') {
                    if (line.indexOf('250-ServiceID=') > -1) {
                        const strID = parser.findStringAfter(line, '250-ServiceID=');
                        if (strID) {
                            controlHiddenService = strID;
                            controlConnection.write('GETINFO net/listeners/socks \r\n');
                        }
                    }
                }
                else {
                    bootError = true;
                }
            }
            else {
                if (-1 < line.indexOf("status/bootstrap-phase")) {
                    const percentStr = parser.findStringBetween(line, "PROGRESS=", " ");
                    if (percentStr) {
                        const percent = percentStr * 1;
                        if (bootProcess != percent) {
                            bootProcess = percent;
                            eventEmitter.emit("update");
                        }
                    }

                }
                if (-1 < line.indexOf("net/listeners/socks")) {
                    const socksPortStr = parser.findStringBetween(line, ":", '"');
                    if (socksPortStr) {
                        socksPort = socksPortStr * 1;
                    }
                }
            }
        });
    });
}

function controlDisconnect(force) {
    if (controlConnection) {
        if (force) { controlConnection.end(); }
        else { controlConnection.write('QUIT\r\n'); }
    }
}

function controlCheckBootstrap() {
    if (controlAuth && controlHiddenService) {
        controlConnection.write('GETINFO status/bootstrap-phase \r\n');
    }
}

exports.newHiddenService = () => {
    if (controlAuth && controlHiddenService) {
        controlHiddenServiceDestroy = true;
        controlConnection.write(`DEL_ONION ${controlHiddenService} \r\n`);
        controlHiddenService = null;
    }
}