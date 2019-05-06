const crypto = require("crypto");
const fs = require('fs');
const path = require('path');

const EventEmitter = require('events');
const SocksClient = require('socks').SocksClient;

const config = require(`${__base}/core/config`);
const constant = require(`${__base}/core/constant`);

const contact = require(`${__base}/core/contact`);
const parser = require(`${__base}/core/network/parser`);
const fileHandler = require(`${__base}/core/fileIO/fileHandler`);
const debug = require(`${__base}/core/debug`);

const SocketIn = require(`${__base}/core/network/NetSocketIn`);
const SocketOut = require(`${__base}/core/network/NetSocketOut`);

const FileRecvList = require(`${__base}/core/fileIO/FileRecvList`);
const FileSendList = require(`${__base}/core/fileIO/FileSendList`);

class NetUser extends EventEmitter {
    constructor(hostname) {
        super();
        this.hostname = hostname;
        debug.log("userStart")

        this.socketIn = null;
        this.socketInConnected = false;
        this.socketOut = null;
        this.socketOutConnected = false;
        this.socketOutConnecting = false;
        this.socketOutWaiting = false;

        this.pongWait = false;
        this.pongWaitTimer = 0;
        this.sendPongReq = false;
        this.sendProfileReq = false;

        this.destroyed = false;

        this.status = 0;
        this.lastActiveTime = new Date();

        this.profileName = "";
        this.profileInfo = "";
        this.clientName = "";
        this.clientVersion = "";

        this.cookie = crypto.randomBytes(20).toString('hex');
        this.cookieOppsite = "";

        this.messageList = [];
        this.fileRecvList = new FileRecvList();
        this.fileSendList = new FileSendList();

        setTimeout(() => {
            setInterval(() => { this.checkSocketOut(); }, 10); // milliseconds
            setInterval(() => { this.checkPongWait(); }, 1000 * 1); // second
            setInterval(() => { this.sendAlive(); }, 1000 * 20); // seconds
            setInterval(() => {
                if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                    this.fileRecvList.fileTransCheck(); this.fileSendList.fileTransCheck();
                }
            }, 100); // milliseconds
            setInterval(() => {
                if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                    this.fileRecvList.fileDataCheck(); this.fileSendList.fileDataCheck();
                }
            }, 1000 * 0.1); // seconds
            setInterval(() => {
                if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                    this.fileRecvList.fileSpeedCheck(); this.fileSendList.fileSpeedCheck();
                }
            }, 1000 * 1); // seconds   
        }, Math.floor(Math.random() * (1000 - 10 + 1)) + 10); // 0.01s ~ 1s delay

        this.fileListinit();
    }

    fileListinit() {
        this.fileRecvList.on('accept', (fileID) => { this.emit('fileaccept', fileID) });
        this.fileRecvList.on('finished', (fileID) => { this.emit('filefinished', fileID) });
        this.fileRecvList.on('cancel', (fileID) => { this.emit('filecancel', fileID) });
        this.fileRecvList.on('error', (fileID) => { this.emit('fileerror', fileID) });
        this.fileRecvList.on('data', (fileID, sendSize) => { this.emit('filedata', fileID, sendSize) });
        this.fileRecvList.on('speed', (fileID, speed) => { this.emit('filespeed', fileID, speed) });

        this.fileSendList.on('accept', (fileID) => { this.emit('fileaccept', fileID) });
        this.fileSendList.on('finished', (fileID) => { this.emit('filefinished', fileID) });
        this.fileSendList.on('cancel', (fileID) => { this.emit('filecancel', fileID) });
        this.fileSendList.on('error', (fileID) => { this.emit('fileerror', fileID) });
        this.fileSendList.on('data', (fileID, sendSize) => { this.emit('filedata', fileID, sendSize) });
        this.fileSendList.on('speed', (fileID, speed) => { this.emit('filespeed', fileID, speed) });

        this.fileSendList.on('senddata', (fileID, blockIndex, blockData) => {
            if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                const sendResult = this.socketIn.sendFiledata(fileID, blockIndex, blockData);
                if (sendResult == false) {
                    this.fileSendList.setSocketDrain(false);
                }
            }
            else {
                this.fileSendList.fileError(fileID, blockIndex)
            }
        })
    }

    checkSocketOut() {
        if (contact.isFriend(this.hostname) || parser.isMyHostname(this.hostname) || this.socketIn) {
            if (!this.socketOut && this.socketOutConnecting == false && this.socketOutWaiting == false) {
                this.socketOutConnecting = true;

                const options = config.getProxyOptions(this.hostname);
                debug.log("[Proxy] Try to connect. options", options);

                if (this.socksClient) {
                    this.socksClient.removeAllListeners();
                }
                this.socksClient = new SocksClient(options);
                this.socksClient.on('established', (info) => {
                    debug.log("[Proxy] Connect success", this.hostname);
                    this.setSocketOut(info.socket);
                    this.socketOutConnecting = false;
                });
                this.socksClient.on('error', (err) => {
                    debug.log("[Proxy] Connect error: ", err);
                    this.socketOutConnecting = false;
                    this.socketOutWaiting = true;
                    setTimeout(() => { this.socketOutWaiting = false; }, constant.ConnectionRetryTime);
                    if (this.socketOut) {
                        this.emit('socketOutDisconnected');
                        if (this.socketOut) { this.socketOut.destroy(); }
                        this.socketOut = null;
                    }
                });
                this.socksClient.connect();
            }
        }

        if (this.socketOut && this.socketIn) {
            if (this.sendPongReq) {
                debug.log('<send pong>', this.cookieOppsite)
                this.socketOut.sendPong(this.cookieOppsite);
                this.pongWait = true;
                this.pongWaitTimer = constant.PongWaitingTime;
                this.sendPongReq = false;
            }
            if (this.socketOutConnected && this.socketInConnected) {
                if (this.sendProfileReq) {
                    debug.log('<send profile>')
                    this.socketOut.sendProfile()
                    this.sendProfileReq = false;
                }
            }
        }

        if (contact.isBlack(this.hostname) && this.destroyed == false) {
            this.destroy();
        }
    }

    checkPongWait() {
        if (this.pongWaitTimer > 0) {
            this.pongWaitTimer -= 1000 * 1 //second;
            if (this.pongWaitTimer <= 0) {
                if (this.pongWait) {
                    debug.log("Pong Wait die");
                    this.destroy();
                }
                this.pongWaitTimer = 0;
            }
        }
    }

    setSocketOut(socket) {
        socket.setKeepAlive(true, constant.KeepAliveTime);

        if (this.socketOut) { this.socketOut.destroy(); }
        this.socketOut = new SocketOut(socket, "");
        this.socketOutConnected = true;
        this.emit('socketOutConnected');
        if (this.socketInConnected) { this.emit('socketBothConnected'); }

        this.socketOut.on('close', () => {
            this.socketOutConnected = false;
            this.socketOutWaiting = true;
            setTimeout(() => { this.socketOutWaiting = false; }, constant.ConnectionRetryTime);
            if (this.socketOut) {
                this.emit('socketOutDisconnected');
                if (this.socketOut) { this.socketOut.destroy(); }
                this.socketOut = null;
            }
        })
        this.socketOut.on('filedata', (fileID, blockIndex, blockData) => {
            if (this.fileRecvList.hasFile(fileID)) {
                this.fileRecvList.filedata(fileID, blockIndex, blockData);
                this.socketOut.sendFileOkay(fileID, blockIndex);
            }
            else {
                this.socketOut.sendFileCancel(fileID);
            }
        })
        debug.log('<send ping>')
        this.socketOut.sendPing(this.cookie);
    }

    setSocketIn(socket, buffer) {
        if (this.socketIn) { this.socketIn.destroy(); }
        this.socketIn = new SocketIn(socket, buffer);

        this.socketIn.on('close', () => {
            this.socketInConnected = false;
            this.emit('socketInDisconnected');

            if (this.socketIn) { this.socketIn.destroy(); }
            this.socketIn = null;
        })
        this.socketIn.on('invalid', () => { debug.log('<invalid1>'); this.destroy(); })

        this.socketIn.on('drain', () => { this.fileSendList.setSocketDrain(true); })

        this.socketIn.on('ping', (hostname, cookieOppsite) => {
            if (this.hostname != hostname) { debug.log('<invalid2>'); this.destroy(); return; }
            debug.log("cookieOppsite", cookieOppsite);
            this.reserveSendPong(cookieOppsite);
        })
        this.socketIn.on('pong', (cookie, clientName, clientVersion) => {
            this.pongValidate(cookie, clientName, clientVersion);
        })
        this.socketIn.on('alive', (status) => {
            if (this.status != status) {
                this.status = status;
                this.emit('status', status);
            }
        })
        this.socketIn.on('profile', (profileName, profileInfo) => {
            if (this.profileName != profileName || this.profileInfo != profileInfo) {
                this.profileName = profileName; this.profileInfo = profileInfo;
                this.emit('profile', profileName, profileInfo);
            }
        })
        this.socketIn.on('message', (message) => {
            this.pushMessage(message, { fromMe: false });
        })
        this.socketIn.on('filesend', (fileID, fileSize, fileName) => {
            this.pushMessage(fileName, { fromMe: false, fileID, fileSize });
            this.fileRecvList.push(fileID, fileSize);
        })
        this.socketIn.on('fileaccept', (fileID) => {
            this.fileSendList.accpetFile(fileID);
        })
        this.socketIn.on('fileokay', (fileID, blockIndex) => {
            this.fileSendList.fileOkay(fileID, blockIndex);
        })
        this.socketIn.on('fileerror', (fileID, blockIndex) => {
            this.fileSendList.fileError(fileID, blockIndex);
        })
        this.socketIn.on('filecancel', (fileID) => {
            this.fileSendList.fileCancel(fileID);
            this.fileRecvList.fileCancel(fileID);
        })
    }

    reserveSendPong(cookieOppsite) {
        debug.log('<sendpong reserve>')
        this.cookieOppsite = cookieOppsite;
        this.sendPongReq = true;
    }

    reserveSendProfile() {
        debug.log('<sendprofile reserve>')
        this.sendProfileReq = true;
    }

    pongValidate(cookie, clientName, clientVersion) {
        if (this.cookie != cookie) { debug.log('<invalid3>', this.cookie, cookie); this.destroy(); return; }

        this.pongWait = false;
        this.socketInConnected = true;
        this.emit('socketInConnected');
        if (this.socketOutConnected) { this.emit('socketBothConnected'); }

        this.reserveSendProfile();

        if (this.clientName != clientName || this.clientVersion != clientVersion) {
            this.clientName = clientName; this.clientVersion = clientVersion;
            this.emit('client', clientName, clientVersion);
        }
    }

    sendAlive() {
        if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
            debug.log('<send alive>')
            this.socketOut.sendAlive();
        }
    }

    pushMessage(message, options) {
        this.messageList.push({ message, options });
        this.lastActiveTime = new Date();

        this.emit('message', message, options);

        while (this.messageList.length > constant.ChatListSize) {
            this.messageList.shift();
        }
    }

    sendMessage(message) { //interface
        return new Promise((resolve, reject) => {
            if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                this.pushMessage(message, { fromMe: true });
                this.socketOut.sendMessage(message);
                resolve();
            }
            else {
                reject(new Error("Not connected"));
            }
        });
    }

    sendFile(file) { //interface
        return new Promise((resolve, reject) => {
            if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                if (!fs.existsSync(file)) { reject(new Error("File not exist")); return; }
                if (!fileHandler.isFile(file)) { reject(new Error("Not a File")); return; }
                if (fileHandler.getSize(file) <= 0) { reject(new Error("File size zero")); return; }
                if (fileHandler.getSize(file) > constant.FileMaximumSize) { reject(new Error("File size too big")); return; }

                const fileID = crypto.randomBytes(20).toString('hex');
                const fileName = path.basename(file);
                const fileSize = fileHandler.getSize(file);

                this.pushMessage(fileName, { fromMe: true, fileID, fileSize: fileSize });
                this.fileSendList.push(fileID, file, fileHandler.getSize(file))

                this.socketOut.sendFilesend(fileID, fileSize, fileName);

                resolve();
            }
            else {
                reject(new Error("Not connected"));
            }
        });
    }

    acceptFile(fileID) { //interface
        return new Promise((resolve, reject) => {
            if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
                this.fileRecvList.acceptFile(fileID);
                this.socketOut.sendFileaccept(fileID);
                resolve();
            }
            else {
                reject(new Error("Not connected"));
            }
        });
    }

    cancelFile(fileID) { //interface
        return new Promise((resolve, reject) => {
            if (this.fileRecvList.fileCancel(fileID)) {
                if (this.socketOut) {
                    this.socketOut.sendFileCancel(fileID);
                }
                resolve();
            }
            else if (this.fileSendList.fileCancel(fileID)) {
                if (this.socketOut) {
                    this.socketOut.sendFileCancel(fileID);
                }
                resolve();
            }
            else {
                reject(new Error("no such file"));
            }
        });
    }

    saveFile(fileID, filePath) { //interface
        return new Promise((resolve, reject) => {
            this.fileRecvList.saveFile(fileID, filePath)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
        })
    }

    destroy() {
        debug.log('<destroy>')
        if (this.socketIn) { this.socketIn.destroy(); this.socketIn = null; }
        if (this.socketOut) { this.socketOut.destroy(); this.socketOut = null; }
        if (this.fileSendList) { this.fileSendList.destroy(); this.fileSendList = null; }
        if (this.fileRecvList) { this.fileRecvList.destroy(); this.fileRecvList = null; }

        this.destroyed = true;
        this.emit('destroy');
        this.removeAllListeners();
    }
}
module.exports = NetUser;