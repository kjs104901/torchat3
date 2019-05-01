const fs = require('fs');
const net = require('net');

const parser = require('../core/parser');
const config = require('../config');
const constant = require('../constant');

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

const torDir = __dirname + "/bin";

let controlConnection = null;
let controlAuth = false;
let controlHiddenService = false;
let controlHiddenServiceDestroy = false;
const controlPortFile = torDir + "/data/controlPort";

exports.deleteControlFile = () => {
    if (fs.existsSync(controlPortFile)) {
        fs.unlinkSync(controlPortFile);
    }
}

exports.checkControlFile = () => {
    return new Promise((resolve, reject) => {
        const controlPortFileIntv = setInterval(() => {
            if (fs.existsSync(controlPortFile)) {
                clearInterval(controlPortFileIntv);
                resolve();
            }
        }, 100);
    })
}

exports.start = (controlPassword, keyPair) => {
    return new Promise((resolve, reject) => {
        let controlPort;
        let constrolPortStr;
        try {
            constrolPortStr = fs.readFileSync(controlPortFile, { encoding: 'utf8' });
        } catch (error) {
            reject(new Error("no control port file"));
            return;
        }

        if (constrolPortStr && constrolPortStr.split) {
            controlPort = ((constrolPortStr.split('\n'))[0]).replace('\r', '').substr(constrolPortStr.indexOf(':') + 1) * 1;
        }
        if (!controlPort) { reject(new Error("control port error")); return; }

        controlConnection = net.connect({ host: "127.0.0.1", port: controlPort });

        controlConnection.once('connect', () => {
            controlConnection.write('AUTHENTICATE "' + controlPassword.string + '" \r\n');
        })

        controlConnection.once('error', (err) => {
            if (err) {
                reject(err);
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

                        controlConnection.write(
                            `ADD_ONION ED25519-V3:${secretKeySerial} ` +
                            `Flags=DiscardPK,Detach ` +
                            `Port=${constant.ServiceInsidePort},127.0.0.1:${config.getServicePort()} \r\n`
                        );

                        controlHiddenServiceDestroy = false;
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
                        reject(new Error("hidden service start failed"));
                    }
                }
                else {
                    if (-1 < line.indexOf("status/bootstrap-phase")) {
                        const percentStr = parser.findStringBetween(line, "PROGRESS=", " ");
                        if (percentStr) {
                            const percent = percentStr * 1;
                            eventEmitter.emit('process', percent);
                        }

                    }
                    if (-1 < line.indexOf("net/listeners/socks")) {
                        const socksPortStr = parser.findStringBetween(line, ":", '"');
                        if (socksPortStr) {
                            const socksPort = socksPortStr * 1;
                            eventEmitter.emit('socksport', socksPort);
                        }
                    }
                }
            });
        });
    })
}

exports.controlDisconnect = (force) => {
    if (controlConnection) {
        if (force) { controlConnection.end(); }
        else { controlConnection.write('QUIT\r\n'); }
    }
}

exports.controlCheckBootstrap = () => {
    if (controlAuth && controlHiddenService) {
        controlConnection.write('GETINFO status/bootstrap-phase \r\n');
    }
}

exports.newHiddenService = () => {
    if (controlAuth && controlHiddenService) {
        controlConnection.write(`DEL_ONION ${controlHiddenService} \r\n`);

        controlHiddenServiceDestroy = true;
        controlHiddenService = null;
    }
}