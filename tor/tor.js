const child_process = require('child_process');

const config = require(`${__base}/core/config`);
const parser = require(`${__base}/core/network/parser`);
const torUtils = require(`${__base}/tor/torUtils`);
const torControl = require(`${__base}/tor/torControl`);

const debug = require(`${__base}/core/debug`);

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

const torDir = fixPathForAsarUnpack(__dirname + "/bin");

function fixPathForAsarUnpack(targetPath) {
    const isElectron = 'electron' in process.versions;
    const isUsingAsar = isElectron && process.mainModule && process.mainModule.filename.includes('app.asar');

    if (isUsingAsar) {
        return targetPath.replace('app.asar', 'app.asar.unpacked');
    }
    return targetPath;
}


// ############################ tor ############################ //
let torProcess = null;

let bootProcess = 0;
let bootSuccess = false;
let bootError;
let bootLogs = [];

let keyPair = null;
let hostname = null;

let socksPort;

exports.start = () => {
    const controlPassword = torUtils.generateControlPassword();
    keyPair = torUtils.generateKeyPair();
    if (!keyPair) { eventEmitter.emit("fail", new Error("failed to generate key pair")); return; }

    hostname = torUtils.generateHostname(keyPair.public);
    debug.log("hostname: ", hostname);

    if (!controlPassword) { eventEmitter.emit("fail", new Error("failed to generate control Password")); return; }
    if (!hostname) { eventEmitter.emit("fail", new Error("failed to generate hostname")); return; }

    torUtils.makeTorrc(controlPassword);
    torControl.deleteControlFile();
    startTorProcess();
    torControl.checkControlFile()
        .then(() => {
            torControl.start(controlPassword, keyPair)
                .catch((err) => {
                    bootError = err;
                })
        })

    checkBootProcess()
        .then(() => {
            eventEmitter.emit("success");
        })
        .catch((err) => {
            eventEmitter.emit("fail", err);
        })
}

torControl.event.on('process', (percent) => {
    if (bootProcess != percent) {
        bootProcess = percent;
        eventEmitter.emit("update");
    }
})

torControl.event.on('socksport', (port) => {
    socksPort = port;
    config.setProxyPort(socksPort);
})

exports.getProgress = () => { return bootProcess; }
exports.getBootLogs = () => { return bootLogs; }

exports.getSuccess = () => { return bootSuccess; }
exports.getError = () => { return bootError; }
exports.getFail = () => { if (bootError) { return true; } else { return false; } }

exports.getKeyPair = () => { return keyPair; }
exports.getHostname = () => { return hostname; }

function startTorProcess() {
    torProcess = child_process.spawn(torDir + '/tor.exe', ['-f', torDir + '/torrc'], { cwd: torDir });

    torProcess.stdout.on('data', (data) => { pushLog(data); });
    torProcess.stderr.on('data', (data) => { pushLog(data); });

    torProcess.on('exit', (code) => {
        torProcess = null;
        torControl.controlDisconnect(true);
    });
}

function pushLog(data) {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        line = line.replace('\r', '')
        if (line.length > 0) {
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
    });
}

function checkBootProcess() {
    return new Promise((resolve, reject) => {
        const bootIntv = setInterval(() => {
            torControl.controlCheckBootstrap();
            if (bootError) {
                clearInterval(bootIntv);

                bootSuccess = false;
                reject(bootError);
            }
            else if (bootProcess >= 100 && socksPort) {
                clearInterval(bootIntv);

                bootSuccess = true;
                resolve();
            }
        }, 100);
    })
}