'use strict';

const crypto = require("crypto");
const fs = require('fs');
const path = require('path');

const EventEmitter = require('events');
const SocksClient = require('socks').SocksClient;

const Identicon = require('identicon.js');

const config = require(`${__base}/core/config`);
const constant = require(`${__base}/core/constant`);

const contacts = require(`${__base}/core/contacts`);
const parser = require(`${__base}/core/network/parser`);
const fileHandler = require(`${__base}/core/fileIO/fileHandler`);
const debug = require(`${__base}/core/debug`);
const langs = require(`${__base}/core/langs`);

const SocketIn = require(`${__base}/core/network/NetSocketIn`);
const SocketOut = require(`${__base}/core/network/NetSocketOut`);

const FileRecvList = require(`${__base}/core/fileIO/FileRecvList`);
const FileSendList = require(`${__base}/core/fileIO/FileSendList`);

class NetUser extends EventEmitter {
    constructor(hostname) {
        super();
        this.hostname = hostname;

        this.socketIn = null;
        this.socketInConnected = false;
        this.socketOut = null;
        this.socketOutConnected = false;
        this.socketOutConnecting = false;
        this.socketOutWaitingTime = 0;

        this.pongWait = false;
        this.pongWaitTimer = 0;
        this.sendPongReq = false;
        this.sendProfileReq = false;

        this.destroyed = false;

        this.status = 0;
        this.lastActiveTime = new Date();

        this.profileName = "";
        this.profileInfo = "";

        const profileImageHash = crypto.createHash('md5').update(this.hostname).digest("hex").substr(0, 32);
        this.profileImage = new Identicon(profileImageHash, { background: [255, 255, 255, 255] }).toString();
        fileHandler.saveProfileImage(this.hostname, this.profileImage);

        this.clientName = "";
        this.clientVersion = "";

        this.cookie = crypto.randomBytes(20).toString('hex');
        this.cookieOppsite = "";

        this.messageList = [];
        this.fileRecvList = new FileRecvList();
        this.fileSendList = new FileSendList();

        setTimeout(() => {
            this.checkSocketOutIntv = setInterval(() => {
                this.checkSocketOut();
            }, 10); // milliseconds

            this.checkPongWaitIntv = setInterval(() => {
                this.checkPongWait();
            }, 1000 * 1); // second

            this.sendAliveIntv = setInterval(() => {
                this.sendAlive();

            }, 1000 * 20); // seconds

            this.fileCheckIntv = setInterval(() => {
                if (this.isBothConnected()) {
                    this.fileRecvList.fileTransCheck(); this.fileSendList.fileTransCheck();
                    this.fileRecvList.fileDataCheck(); this.fileSendList.fileDataCheck();
                }
            }, 100); // milliseconds

            this.fileSpeedCheckIntv = setInterval(() => {
                if (this.isBothConnected()) {
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
        this.fileRecvList.on('saved', (fileID) => { this.emit('filesaved', fileID) });
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
            if (this.isBothConnected()) {
                const sendResult = this.socketIn.sendFiledata(fileID, blockIndex, blockData);
                if (sendResult === false) {
                    this.fileSendList.setSocketDrain(false);
                }
            }
            else {
                this.fileSendList.fileError(fileID, blockIndex)
            }
        })
    }

    checkSocketOut() {
        if (this.socketOutWaitingTime > 0) {
            this.socketOutWaitingTime -= 10; // milliseconds
        }

        if (contacts.isFriend(this.hostname) || parser.isMyHostname(this.hostname) || this.socketIn) {
            if (!this.socketOut && this.socketOutConnecting === false && this.socketOutWaitingTime <= 0) {
                this.socketOutConnecting = true;

                const options = config.getProxyOptions(this.hostname);
                debug.log("[Proxy] Try to connect: ", this.hostname);

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
                    debug.log("[Proxy] Connect error: ", this.hostname, err);
                    this.socketOutConnecting = false;
                    this.socketOutWaitingTime = constant.ConnectionRetryTime;
                    this.socketOutWaitingTime += (Math.floor(Math.random() * 10) * 1000); // 0 ~ 9 seconds
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

        if (contacts.isBlack(this.hostname) && this.destroyed === false) {
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
            this.socketOutWaitingTime = constant.ConnectionRetryTime
            this.socketOutWaitingTime += (Math.floor(Math.random() * 10) * 1000); // 0 ~ 9 seconds
            if (this.socketOut) {
                this.emit('socketOutDisconnected');
                if (this.socketOut) { this.socketOut.destroy(); }
                this.socketOut = null;
            }
        })
        this.socketOut.on('invalid', () => {
            debug.log('<invalid1>'); this.destroy();
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

            this.cancelSendPong();
        })
        this.socketIn.on('invalid', () => { debug.log('<invalid1>'); this.destroy(); })

        this.socketIn.on('drain', () => { this.fileSendList.setSocketDrain(true); })

        this.socketIn.on('ping', (hostname, cookieOppsite) => {
            if (this.hostname !== hostname) { debug.log('<invalid2>'); this.destroy(); return; }
            debug.log("cookieOppsite", cookieOppsite);
            this.reserveSendPong(cookieOppsite);
        })
        this.socketIn.on('pong', (cookie, clientName, clientVersion) => {
            this.pongValidate(cookie, clientName, clientVersion);
        })
        this.socketIn.on('alive', (status) => {
            if (this.status !== status) {
                this.status = status;
                this.emit('status', status);
            }
        })
        this.socketIn.on('profile', (profileName, profileInfo) => {
            if (this.profileName !== profileName || this.profileInfo !== profileInfo) {
                this.profileName = profileName; this.profileInfo = profileInfo;
                this.emit('profile', profileName, profileInfo);
            }
        })
        this.socketIn.on('message', (message) => {
            this.pushMessage(message, { fromSelf: false });
        })
        this.socketIn.on('filesend', (fileID, fileSize, fileName) => {
            this.pushMessage(fileName, { fromSelf: false, fileID, fileSize, saved: false });
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

    cancelSendPong() {
        this.sendPongReq = false;
    }

    reserveSendProfile() {
        debug.log('<sendprofile reserve>')
        this.sendProfileReq = true;
    }

    pongValidate(cookie, clientName, clientVersion) {
        if (this.cookie !== cookie) { debug.log('<invalid3>', this.cookie, cookie); this.destroy(); return; }

        this.pongWait = false;
        this.socketInConnected = true;
        this.emit('socketInConnected');
        if (this.socketOutConnected) { this.emit('socketBothConnected'); }

        this.reserveSendProfile();

        if (this.clientName !== clientName || this.clientVersion !== clientVersion) {
            this.clientName = clientName; this.clientVersion = clientVersion;
            this.emit('client', clientName, clientVersion);
        }
    }

    sendAlive() {
        if (this.isBothConnected()) {
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
            if (!this.isBothConnected()) { reject(new Error(langs.get('ErrorNotConnected'))); return; }
            if (!contacts.isFriend(this.hostname)) { reject(new Error(langs.get('ErrorChatNotFriend'))); return; }

            this.pushMessage(message, { fromSelf: true });
            this.socketOut.sendMessage(message);
            resolve();
        });
    }

    sendFile(file) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isBothConnected()) { reject(new Error(langs.get('ErrorNotConnected'))); return; }
            if (!contacts.isFriend(this.hostname)) { reject(new Error(langs.get('ErrorChatNotFriend'))); return; }

            if (!fs.existsSync(file)) { reject(new Error(langs.get('ErrorFileNotExists'))); return; }
            if (!fileHandler.isFile(file)) { reject(new Error(langs.get('ErrorNotFile'))); return; }
            if (fileHandler.getSize(file) <= 0) { reject(new Error(langs.get('ErrorEmptyFile'))); return; }
            if (fileHandler.getSize(file) > constant.FileMaximumSize) { reject(new Error(langs.get('ErrorFileTooBig'))); return; }

            const fileID = crypto.randomBytes(20).toString('hex');
            const fileName = path.basename(file);
            const fileSize = fileHandler.getSize(file);

            this.pushMessage(fileName, { fromSelf: true, fileID, fileSize: fileSize });
            this.fileSendList.push(fileID, file, fileHandler.getSize(file))

            this.socketOut.sendFilesend(fileID, fileSize, fileName);

            resolve();
        });
    }

    acceptFile(fileID) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isBothConnected()) { reject(new Error(langs.get('ErrorNotConnected'))); return; }
            if (!contacts.isFriend(this.hostname)) { reject(new Error(langs.get('ErrorChatNotFriend'))); return; }

            this.fileRecvList.acceptFile(fileID);
            this.socketOut.sendFileaccept(fileID);
            resolve();
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
                reject(new Error(langs.get('ErrorNoSuchFile')));
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

    isBothConnected() {
        if (this.socketOut && this.socketOutConnected && this.socketIn && this.socketInConnected) {
            return true;
        }
        return false;
    }

    destroy() {
        debug.log('<destroy>')
        if (this.socketIn) { this.socketIn.destroy(); this.socketIn = null; }
        if (this.socketOut) { this.socketOut.destroy(); this.socketOut = null; }
        if (this.fileSendList) { this.fileSendList.destroy(); this.fileSendList = null; }
        if (this.fileRecvList) { this.fileRecvList.destroy(); this.fileRecvList = null; }

        if (this.checkSocketOutIntv) { clearInterval(this.checkSocketOutIntv) }
        if (this.checkPongWaitIntv) { clearInterval(this.checkPongWaitIntv) }
        if (this.sendAliveIntv) { clearInterval(this.sendAliveIntv) }
        if (this.fileCheckIntv) { clearInterval(this.fileCheckIntv) }
        if (this.fileSpeedCheckIntv) { clearInterval(this.fileSpeedCheckIntv) }

        this.destroyed = true;
        this.emit('destroy');
        this.removeAllListeners();
    }
}
module.exports = NetUser;