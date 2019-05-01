
/**
 *           interface
 * 
 * isValid() return value
 * 
 * sendMessage(message) return Promise
 * 
 * sendFileSend(filename) return Promise
 * sendFileAccept(fileID) return Promise
 * fileCancel(fileID) return Promise
 * 
 */

const SocksClient = require('socks').SocksClient;
const crypto = require("crypto");
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const tor = require('../tor/tor');
const torUtil = require('../tor/torUtils')
const config = require('../config');
const constant = require('../constant');

const parser = require('./parser');
const protocol = require('./protocol');
const fileHandler = require('./fileHandler');
const contact = require('./contact');

setInterval(() => { contact.getUserListRaw().forEach(user => { user.socketCheck(); }); }, 1); // milliseconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.bufferCheck(); }); }, 1); // milliseconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.sendAlive(); }); }, 1000 * 20); // seconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.fileTransCheck(); }); }, 100); // milliseconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.fileDataRecvCheck(); }); }, 1000 * 0.1); // seconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.fileSpeedCheck(); }); }, 1000 * 1); // seconds

class User extends EventEmitter {
    constructor(hostname) {
        super();
        this.socksClient;

        this.hostname = hostname;
        this.valid = false;
        this.destroyed = false;
        this.halfConnected = false;
        this.status = 0;

        this.income = false;

        this.profileName = "";
        this.profileInfo = "";
        this.clientName = "";
        this.clientVersion = "";

        this.randomStr = crypto.randomBytes(20).toString('hex');
        this.randomStrPong = "";
        this.sendPongReq = false;

        this.socketOut = null;
        this.socketOutConnecting = false;
        this.socketOutRetryWait = false;
        this.bufferOut = "";

        this.socketIn = null;
        this.socketInDrain = true;
        this.bufferIn = "";

        this.messageList = [];
        this.lastMessageDate = new Date();

        this.fileSendList = [];
        this.fileRecvList = [];
    }

    socketCheck() {
        if (!this.socketOut && this.socketOutConnecting == false && this.socketOutRetryWait == false) {
            if (contact.isFriend(this.hostname) || this.income || this.socketIn) {
                this.income = false;
                console.log("Try connecting to server");
                this.socketOutConnecting = true;
                this.connect()
                    .then((socket) => {
                        this.setSocketOut(socket);
                        console.log("Connect success", this.hostname);
                        this.socketOutConnecting = false;
                    })
                    .catch((err) => {
                        console.log("Connect failed: ", err);
                        this.socketOutConnecting = false;
                        this.closeSocketOut();
                    })
            }
        }

        if (contact.isBlack(this.hostname)) {
            this.destroy();
        }

        if (this.sendPongReq) {
            this.sendPong();
        }

        if (!this.socketOut || !this.socketIn || !this.valid) {
            if (this.status != 0) {
                this.status = 0;
                this.halfConnected = false;
                this.emit('disconnect');
            }
        }

        if (!this.socketOut && !this.socketIn) {
            if (this.halfConnected) {
                this.halfConnected = false;
            }
        }
        else if (!this.socketOut || !this.socketIn) {
            if (!this.halfConnected) {
                this.halfConnected = true;
                this.emit('halfconnect');
            }
        }

        if (this.bufferOut > constant.BufferMaximum || this.bufferIn > constant.BufferMaximum) {
            this.destroy();
        }
    }

    connect() {
        const options = {
            proxy: { host: '127.0.0.1', port: config.getProxyPort(), type: 5 },
            command: 'connect',
            destination: { host: this.hostname + ".onion", port: 12009 },
            timeout: constant.ProxyTimeOut
        };

        //test
        console.log("options", options);

        return new Promise((resolve, reject) => {
            this.socksClient = new SocksClient(options);
            this.socksClient.on('established', (info) => {
                resolve(info.socket);
            });
            this.socksClient.on('error', (err) => {
                reject(err);
            });
            this.socksClient.connect();
        });
    }

    closeSocketOut() {
        if (this.socketOut && !this.socketOut.destroyed) { this.socketOut.destroy(); }

        this.socketOut = null;
        this.socketOutConnecting = false;
        this.socketOutRetryWait = true;
        this.bufferOut = "";

        setTimeout(() => { this.socketOutRetryWait = false; }, constant.ConnectionRetryTime);
    }

    closeSocketIn() {
        if (this.socketIn && !this.socketIn.destroyed) { this.socketIn.destroy(); }

        this.socketIn = null;
        this.bufferIn = "";
    }

    destroy() {
        this.closeSocketOut();
        this.closeSocketIn();
        this.status = 0;
        this.valid = false;
        this.destroyed = true;
        this.emit('disconnect');
    }

    isConnected() {
        if (this.socketIn && this.socketOut) {
            return true;
        }
        return false;
    }

    isValid() { //interface
        if (this.isConnected() && this.valid) {
            return true;
        }
        return false;
    }

    validate(randomStr) {
        if (this.randomStr != randomStr) {
            this.destroy();
        }
        else {
            this.valid = true;
            this.halfConnected = false;
            this.emit('connect');

            //test
            console.log("valid")

            this.sendAlive();
            this.sendProfile();
        }
    }

    setSocketOut(socket) {
        this.socketOut = socket;
        this.socketOut.on('close', () => {
            console.log('disconnected from server');
            this.closeSocketOut();
        });
        this.socketOut.on('timeout', () => {
            console.log('disconnected from server [timeout]');
            this.closeSocketOut();
        })
        this.socketOut.on('error', (err) => {
            console.log('error from server');
            this.closeSocketOut();
        });

        const keyPair = tor.getKeyPair();
        const publicKeyStr = keyPair.public.toString('base64');
        const signed = torUtil.sign(publicKeyStr + this.randomStr, keyPair.public, keyPair.secret);
        const signedStr = signed.toString('base64');
        protocol.ping(this.socketOut, publicKeyStr, this.randomStr, signedStr);

        this.socketOut.on('data', (data) => {
            this.bufferOut += data.toString('binary');
        });
    }

    setSocketIn(socket, buffer) {
        this.bufferIn = buffer;

        this.socketIn = socket;
        this.socketIn.on('close', () => {
            console.log('disconnected from client');
            this.closeSocketIn();
        });
        this.socketIn.on('timeout', () => {
            console.log('disconnected from client [timeout]');
            this.closeSocketIn();
        })
        this.socketIn.on('error', (err) => {
            console.log('error from client');
            this.closeSocketIn();
        });
        this.socketIn.on('data', (data) => {
            this.bufferIn += data.toString();
        });
        this.socketIn.on('drain', () => {
            this.socketInDrain = true;
            //test
            console.log("drain")
        })
    }

    hasIncome(randomStrPong) {
        this.income = true;
        this.socketOutRetryWait = false;

        this.randomStrPong = randomStrPong;
        this.sendPongReq = true;
    }

    bufferCheck() {
        if (this.bufferIn && this.bufferIn.length > 0) {
            let publicKeyStr, publicKey, signedStr, signed;
            let hostname, randomStrPong, clientName, clientVersion;
            let status, profileName, profileInfo;
            let message;
            let fileID, fileSize, fileName, parsed, blockIndex;

            while (this.bufferIn.indexOf('\n') > -1) {
                let parsed = parser.buffer(this.bufferIn);
                const dataList = parsed.dataList;
                this.bufferIn = parsed.bufferAfter;

                if (!protocol.validate(dataList)) { continue; }
                switch (dataList[0]) {
                    case 'ping':
                        publicKeyStr = dataList[1];
                        publicKey = Buffer.from(publicKeyStr, 'base64');
                        randomStrPong = dataList[2];
                        signedStr = dataList[3];
                        signed = Buffer.from(signedStr, 'base64');

                        hostname = torUtil.generateHostname(publicKey);
                        if (torUtil.verify(publicKeyStr + randomStrPong, signed, publicKey)) {
                            if (this.hostname == hostname) {
                                this.randomStrPong = randomStrPong;
                                this.sendPongReq = true;
                            }
                            else {
                                console.log("something wrong");
                                this.destroy();
                            }
                        }
                        else {
                            console.log("something wrong");
                            this.destroy();
                        }
                        break;

                    case 'pong':
                        randomStrPong = dataList[1];
                        clientName = dataList[2];
                        clientVersion = dataList[3];

                        this.validate(randomStrPong);
                        this.clientName = clientName;
                        this.clientVersion = clientVersion;

                        this.emit('client', clientName, clientVersion);
                        break;

                    case 'alive':
                        status = dataList[1];

                        //test
                        console.log("recv Alive", this.hostname);
                        if (this.status != status * 1) {
                            this.status = status * 1;
                            this.emit('status', status);
                        }
                        break;

                    case 'profile':
                        profileName = dataList[1];
                        profileInfo = dataList[2];

                        profileName = parser.removeNewline(parser.unescape(profileName));
                        profileName = parser.limitateLength(profileName, constant.MaxLenProfileName);

                        profileInfo = parser.unescape(profileInfo);
                        profileInfo = parser.limitateLength(profileInfo, constant.MaxLenProfileInfo);

                        this.profileName = profileName;
                        this.profileInfo = parser.unescape(profileInfo);

                        this.emit('profile', profileName, profileInfo);
                        break;

                    case 'message':
                        message = dataList[1];
                        message = parser.unescape(message);
                        message = parser.limitateLength(message, constant.MaxLenChatMessage);

                        this.pushMessage(message, { fromMe: false });
                        break;

                    case 'filesend':
                        fileID = dataList[1];
                        fileSize = dataList[2] * 1;
                        fileName = dataList[3];

                        fileName = parser.removeNewline(parser.unescape(fileName));
                        parsed = path.parse(fileName);
                        fileName = parser.limitateLength(parsed.name, constant.MaxLenFileName) + parsed.ext;

                        this.pushMessage(fileName, {
                            fromMe: false,
                            fileID: fileID, fileSize: fileSize,
                        });
                        this.pushFileRecvList(fileID, fileSize);

                        break;
                    case 'fileaccept':
                        fileID = dataList[1];

                        //test
                        console.log('fileaccept', fileID);
                        this.acceptFileSend(fileID);
                        break;

                    case 'fileokay':
                        fileID = dataList[1];
                        blockIndex = dataList[2] * 1;

                        this.fileOkay(fileID, blockIndex);
                        break;

                    case 'fileerror':
                        fileID = dataList[1];
                        blockIndex = dataList[2] * 1;

                        this.fileError(fileID, blockIndex);
                        break;

                    case 'filecancel':
                        fileID = dataList[1];

                        this.fileCancel(fileID);
                        break;

                    default:
                        console.log("Unknown instruction[in]: ", dataList);
                        break;
                }
            }
        }

        if (this.bufferOut && this.bufferOut.length > 0) { // only for file data
            let fileID, blockIndex, blockHash, blockData;

            while (this.bufferOut.indexOf('\n') > -1) {
                let parsed = parser.buffer(this.bufferOut);
                const dataList = parsed.dataList;
                this.bufferOut = parsed.bufferAfter;

                if (!protocol.validate(dataList)) { continue; }
                switch (dataList[0]) {
                    case 'filedata':
                        fileID = dataList[1];
                        blockIndex = dataList[2] * 1;
                        blockHash = dataList[3];
                        blockData = parser.unescape(dataList[4]);

                        let fileRecvIndex = -1;
                        this.fileRecvList.forEach((filerecv, index) => {
                            if (filerecv.fileID == fileID) { fileRecvIndex = index; }
                        });

                        if (-1 < fileRecvIndex) {
                            if (fileHandler.getMD5(blockData) == blockHash) {
                                this.filedataRecv(fileID, blockIndex, blockData);
                                this.sendFileOkay(fileID, blockIndex);
                            }
                            else {
                                this.sendFileError(fileID, blockIndex);
                            }
                        }
                        else {
                            this.sendFileCancel(fileID);
                        }

                        break;

                    default:
                        console.log("Unknown instruction[out]: ", dataList);
                        break;
                }
            }
        }
    }

    sendPong() {
        if (!this.isConnected()) { return; }

        protocol.pong(this.socketOut, this.randomStrPong, constant.ClientName, constant.ClientVersion);
        this.sendPongReq = false;
    }

    sendAlive() {
        //if (!this.isValid()) { return; } // to send alive while waiting for other side come.
        if (!this.socketOut) { return; }

        //test
        console.log("send Alive", this.hostname);
        protocol.alive(this.socketOut, config.getSetting().userStatus);
    }

    sendProfile() {
        if (!this.isValid()) { return; }

        protocol.profile(this.socketOut, config.getSetting().profileName, config.getSetting().profileInfo);
    }

    sendMessage(message) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isValid()) { reject(new Error("Not connected")); return; }

            this.pushMessage(message, { fromMe: true });
            protocol.message(this.socketOut, message);
            resolve();
        });
    }

    pushMessage(message, options) {
        this.messageList.push({ message, options });
        this.lastMessageDate = new Date();

        this.emit('message', message, options);

        while (this.messageList.length > constant.ChatListSize) {
            this.messageList.shift();
        }
    }

    sendFileSend(file) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isValid()) { reject(new Error("Not connected")); return; }
            if (!fs.existsSync(file)) { reject(new Error("File not exist")); return; }
            if (!fileHandler.isFile(file)) { reject(new Error("Not a File")); return; }
            if (fileHandler.getSize(file) <= 0) { reject(new Error("File size zero")); return; }
            if (fileHandler.getSize(file) > constant.FileMaximumSize) { reject(new Error("File size too big")); return; }

            const fileID = crypto.randomBytes(20).toString('hex');
            const fileName = path.basename(file);
            const fileSize = fileHandler.getSize(file);

            this.pushMessage(fileName, {
                fromMe: true,
                fileID: fileID, fileSize: fileSize,
            });
            this.pushFileSendList(fileID, file, fileHandler.getSize(file));

            protocol.filesend(this.socketOut, fileID, fileSize, fileName);

            resolve();
        });
    }

    pushFileSendList(fileID, file, fileSize) {
        this.fileSendList.push({
            fileID, file, fileSize,
            accepted: false, finished: false,
            sendBlock: 0, sendSize: 0, tempSize: 0, speedSize: 0,
            okayBlock: -1, okayList: [],
            bufferSize: 0,
        })
    }

    pushFileRecvList(fileID, fileSize) {
        this.fileRecvList.push({
            fileID, fileSize,
            accepted: false, finished: false,
            bufferList: {}, recvSize: 0, tempSize: 0, speedSize: 0,
            blockIndex: 0, blockWriting: false
        })
    }

    sendFileAccept(fileID) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isValid()) { reject(new Error("Not connected")); return; }

            this.acceptFileRecv(fileID);
            protocol.fileaccept(this.socketOut, fileID);
            resolve();
        });
    }

    acceptFileSend(fileID) {
        this.fileSendList.forEach(fileSend => {
            if (fileSend.fileID == fileID) {
                fileSend.accepted = true;
                this.emit('fileaccept', fileID);
            }
        });
    }

    acceptFileRecv(fileID) {
        this.fileRecvList.forEach(fileRecv => {
            if (fileRecv.fileID == fileID) {
                fileRecv.accepted = true;
                this.emit('fileaccept', fileID);
            }
        });
    }

    sendFileOkay(fileID, blockIndex) {
        protocol.fileokay(this.socketOut, fileID, blockIndex);
    }

    sendFileError(fileID, blockIndex) {
        protocol.fileerror(this.socketOut, fileID, blockIndex);
    }

    sendFileCancel(fileID) {
        protocol.filecancel(this.socketOut, fileID);
    }

    filedataRecv(fileID, blockIndex, blockData) {
        if (this.isValid()) {
            this.fileRecvList.forEach(filerecv => {
                if (filerecv.fileID == fileID && filerecv.accepted) {
                    filerecv.bufferList[blockIndex] = blockData;
                }
            });
        }
    }

    fileOkay(fileID, blockIndex) {
        this.fileSendList.forEach(filesend => {
            if (filesend.fileID == fileID) {
                if (!filesend.okayList[blockIndex]) {
                    filesend.okayList[blockIndex] = true;

                    filesend.sendSize += constant.FileBlockSize;
                    filesend.tempSize += constant.FileBlockSize;
                }

                const blockNum = fileHandler.getBlockNum(filesend.file, constant.FileBlockSize);
                for (let index = 0; index <= blockNum; index++) {
                    if (filesend.okayList[index]) {
                        filesend.okayBlock = index;
                    }
                    else {
                        break;
                    }
                }

                if (blockNum - 1 <= filesend.okayBlock) {
                    filesend.accepted = false;
                    filesend.finished = true;
                    this.fileSlowFree(filesend.fileID);
                    this.emit('filefinished', filesend.fileID);

                    //test
                    console.log("filefinished1");
                }
            }
        });
    }

    fileError(fileID, blockIndex) {
        this.fileSendList.forEach(filesend => {
            if (filesend.fileID == fileID) {
                if (blockIndex < filesend.sendBlock) {
                    //test
                    console.log("fileError", blockIndex)
                    filesend.sendBlock = blockIndex;
                }
            }
        });
    }

    fileCancel(fileID) { //interface
        return new Promise((resolve, reject) => {
            let changed = false;
            this.fileSendList = this.fileSendList.filter((filesend) => {
                if (filesend.fileID == fileID) {
                    this.emit('filecancel', filesend.fileID);
                    this.sendFileCancel(fileID);
                    changed = true;
                    return false;
                }
                return true;
            })
            this.fileRecvList = this.fileRecvList.filter((filerecv) => {
                if (filerecv.fileID == fileID) {
                    this.emit('filecancel', filerecv.fileID);
                    changed = true;
                    return false;
                }
                return true;
            })

            if (changed) { resolve(); }
            else { reject(new Error("no such file")); }
        });
    }

    fileSlowFree(fileID) {
        setTimeout(() => {
            this.fileSendList = this.fileSendList.filter((filesend) => {
                if (filesend.fileID == fileID) { return false; }
                return true;
            })
            this.fileRecvList = this.fileRecvList.filter((filerecv) => {
                if (filerecv.fileID == fileID) { return false; }
                return true;
            })
        }, 1000 * 10)
    }

    fileTransCheck() {
        if (this.isValid()) {
            let sendFirstFile = false;
            this.fileSendList.forEach(filesend => {
                if (filesend.accepted && !sendFirstFile) {
                    const blockNum = fileHandler.getBlockNum(filesend.file, constant.FileBlockSize);
                    while (filesend.accepted && filesend.sendBlock < blockNum && filesend.sendBlock < filesend.okayBlock + constant.FileBlockWindow
                        && filesend.bufferSize < constant.FileBufferSize && this.socketInDrain) {
                        //test
                        console.log("file read: ", path.basename(filesend.file));
                        filesend.bufferSize += constant.FileBlockSize;
                        fileHandler.readFileBlock(filesend.file, constant.FileBlockSize, filesend.sendBlock)
                            .then((data) => {
                                const blockIndex = data.index;
                                const blockHash = fileHandler.getMD5(data.buffer);
                                const blockData = data.buffer;

                                filesend.bufferSize -= constant.FileBlockSize;

                                const sendRst = protocol.filedata(this.socketIn, filesend.fileID, blockIndex, blockHash, blockData);
                                if (sendRst == false) {
                                    this.socketInDrain = false;
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                filesend.bufferSize -= constant.FileBlockSize;
                                filesend.accepted = false;
                                this.emit('fileerror', filesend.fileID);
                            })
                        filesend.sendBlock += 1;
                    }
                    if (filesend.accepted && !filesend.finished) {
                        sendFirstFile = true;
                    }
                }
            });

            this.fileRecvList.forEach(filerecv => {
                if (filerecv.accepted && filerecv.blockWriting == false && Object.keys(filerecv.bufferList).length > 0) {
                    let bufferSum = "";
                    let fileName = './' + filerecv.fileID;
                    let createFile = false;
                    if (filerecv.blockIndex == 0) { createFile = true; }

                    while (filerecv.bufferList[filerecv.blockIndex]) {
                        bufferSum += filerecv.bufferList[filerecv.blockIndex]

                        filerecv.recvSize += filerecv.bufferList[filerecv.blockIndex].length;
                        filerecv.tempSize += filerecv.bufferList[filerecv.blockIndex].length;

                        delete filerecv.bufferList[filerecv.blockIndex];
                        filerecv.blockIndex += 1;
                    }

                    if (bufferSum.length > 0) {
                        filerecv.blockWriting = true;
                        if (createFile) { fileHandler.writeFileClear(fileName); }
                        fileHandler.writeFileAppend(fileName, bufferSum)
                            .then((recvSize) => {
                                filerecv.blockWriting = false;
                            })
                            .catch((err) => {
                                console.log(err);
                                filerecv.blockWriting = false;
                                filerecv.accepted = false;
                                this.emit('fileerror', filerecv.fileID);
                            })
                    }
                }

                if (filerecv.fileSize <= filerecv.recvSize && filerecv.blockWriting == false) {
                    filerecv.accepted = false;
                    filerecv.finished = true;
                    this.fileSlowFree(filerecv.fileID);
                    this.emit('filefinished', filerecv.fileID);
                }
            })
        }
    }

    fileDataRecvCheck() {
        if (this.isValid()) {
            this.fileSendList.forEach(filesend => {
                if ((filesend.accepted || filesend.finished) && filesend.tempSize > 0) {
                    this.emit('filedata', filesend.fileID, filesend.sendSize);

                    filesend.speedSize += filesend.tempSize;
                    filesend.tempSize = 0;
                }
            });

            this.fileRecvList.forEach(filerecv => {
                if ((filerecv.accepted || filerecv.finished) && filerecv.tempSize > 0) {
                    this.emit('filedata', filerecv.fileID, filerecv.recvSize);

                    filerecv.speedSize += filerecv.tempSize;
                    filerecv.tempSize = 0;
                }
            });
        }
    }

    fileSpeedCheck() {
        if (this.isValid()) {
            this.fileSendList.forEach(filesend => {
                //test
                //console.log("WTF", filesend.accepted, filesend.finished, filesend.speedSize);
                if ((filesend.accepted || filesend.finished) && filesend.speedSize > 0) {
                    const speed = filesend.speedSize;
                    this.emit('filespeed', filesend.fileID, speed);
                    //test
                    console.log("filespeed", speed);

                    filesend.speedSize = 0;
                }
            });

            this.fileRecvList.forEach(filerecv => {
                if ((filerecv.accepted || filerecv.finished) && filerecv.speedSize > 0) {
                    const speed = filerecv.speedSize;
                    this.emit('filespeed', filerecv.fileID, speed);
                    //test
                    console.log("filespeed", speed);

                    filerecv.speedSize = 0;
                }
            });
        }
    }
}
module.exports = User;