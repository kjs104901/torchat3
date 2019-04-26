const fs = require('fs');
const crypto = require("crypto");
const net = require('net');
const child_process = require('child_process');
const config = require('../config');

const torDir = __dirname + "/bin";

// ############################ torrc ############################ //
const controlPassword = crypto.randomBytes(20).toString('hex');
let controlPasswordHashed;

function makeTorrc() {
    fs.writeFileSync(__dirname + '/torrc',
        `
SocksPort auto
ControlPort auto
ControlPortWriteToFile ./data/controlPort
HashedControlPassword ${controlPasswordHashed}

HiddenServiceDir ./hidden_service
HiddenServiceVersion 3
HiddenServicePort ${config.ServiceInsidePort} 127.0.0.1:${config.servicePort}
LongLivedPorts ${config.ServiceInsidePort}

UseBridges ${config.userBridge}
Bridge ${config.bridge}

DataDirectory ./data
    ` + config.torrcExpand
    );
}

// ############################ tor ############################ //
let torProcess = null;

let bootstrap = 0;
let bootError = false;
let bootLogs = [];

let hostname = "";
let publicKey = null;
let privateKey = null;

let socksPort;

exports.start = () => {
    return new Promise((resolve, reject) => {
        const execString = child_process.execFileSync(torDir + '/tor.exe', ['--hash-password', controlPassword], { cwd: torDir, encoding: 'utf8' });
        if (execString.length <= 0) { reject(new Error("Control Hashing failed")); return; }
        const execList = execString.split('\n');
        execList.forEach(line => {
            if (line.indexOf('16:') == 0) {
                controlPasswordHashed = line.replace('\r', '');
            }
        });
        if (!controlPasswordHashed) { reject(new Error("Control Hashing failed")); return; }

        makeTorrc();
        torProcess = child_process.spawn(torDir + '/tor.exe', ['-f', __dirname + '/torrc'], { cwd: torDir });

        torProcess.stdout.on('data', (data) => {
            console.log(data.toString());
            bootLogs.push(data.toString());
        });
        torProcess.stderr.on('data', (data) => { });

        torProcess.on('exit', (code) => {
            torProcess = null;
            bootstrap = 0;
            bootError = false;

            controlDisconnect(true);
        });

        if (fs.existsSync(controlPortFile)) { fs.unlinkSync(controlPortFile); }
        const controlPortFileIntv = setInterval(() => {
            if (fs.existsSync(controlPortFile)) {
                controlConnect();
                clearInterval(controlPortFileIntv);
            }
        }, 100);

        const bootIntv = setInterval(() => {
            controlCheckBootstrap();
            if (bootError) {
                clearInterval(bootIntv);
                reject(new Error("Boot failed"));
            }
            else if (bootstrap >= 100 && socksPort) {
                clearInterval(bootIntv);

                const hostnameArr = fs.readFileSync(torDir + "/hidden_service/hostname").toString().split("\n");
                if (hostnameArr && hostnameArr[0]) {
                    hostname = hostnameArr[0].replace('\r', '').replace(".onion", '');
                }
                publicKey = fs.readFileSync(torDir + "/hidden_service/hs_ed25519_public_key");
                privateKey = fs.readFileSync(torDir + "/hidden_service/hs_ed25519_secret_key");

                config.ProxyOptions.proxy.port = socksPort;

                controlDisconnect(false);

                resolve(true);
            }
        }, 100);
    });
}

exports.getStatus = () => {
    if (torProcess) {
        return {
            pid: torProcess.pid,
            connected: torProcess.connected,
            killed: torProcess.killed,
        }
    }
}

exports.getBootstrap = () => { return bootstrap; }
exports.getBootLogs = () => { return bootLogs; }

exports.getHostname = () => { return hostname; }
exports.getPublicKey = () => { return publicKey; }
exports.getPrivateKey = () => { return privateKey; }


// ############################ tor control ############################ //
let controlConnection = null;
let controlAuth = false;
const controlPortFile = torDir + "/data/controlPort";

function controlConnect() {
    let controlPort;
    const constrolPortStr = fs.readFileSync(controlPortFile, { encoding: 'utf8' });
    if (constrolPortStr && constrolPortStr.split) {
        controlPort = ((constrolPortStr.split('\n'))[0]).replace('\r', '').substr(constrolPortStr.indexOf(':') + 1) * 1;
    }
    if (!controlPort) { bootError = true; return; }

    controlConnection = net.connect({ host: "127.0.0.1", port: controlPort });
    controlConnection.write('AUTHENTICATE "' + controlPassword + '" \r\n');

    controlConnection.once('error', (err) => {
        if (err) {
            console.log(err);
            bootError = true;
        }
    });

    controlConnection.once('end', () => {
        controlConnection = null;
        controlAuth = false;
    })

    controlConnection.on('data', (data) => {
        data = data.toString();

        if (controlAuth) {
            if (-1 < data.indexOf("status/bootstrap-phase")) {
                const s = data.indexOf("PROGRESS=") + "PROGRESS=".length;
                const e = data.indexOf(" ", s);

                bootstrap = data.substring(s, e) * 1;
            }
            if (-1 < data.indexOf("net/listeners/socks")) {
                const s = data.indexOf(":") + ":".length;
                const e = data.indexOf('"', s);

                socksPort = data.substring(s, e) * 1;
            }
        }
        else {
            if (data.substr(0, 3) === '250') {
                controlAuth = true;
                controlGetSocksPort();
            }
            else {
                bootError = true;
            }
        }
    });
}

function controlDisconnect(force) {
    if (controlConnection) {
        if (force) {
            controlConnection.end();
            controlConnection = null;
            controlAuth = false;
        }
        else {
            controlConnection.write('QUIT\r\n');
        }
    }
}

function controlCheckBootstrap() {
    if (controlAuth) {
        controlConnection.write('GETINFO status/bootstrap-phase \r\n');
    }
}

function controlGetSocksPort() {
    if (controlAuth) {
        controlConnection.write('GETINFO net/listeners/socks \r\n');
    }
}