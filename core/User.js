const SocksClient = require('socks').SocksClient;
const crypto = require("crypto");
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const tor = require('../tor/tor');
const config = require('../config');

const parser = require('./parser');
const protocol = require('./protocol');
const fileHandler = require('./fileHandler');
const contact = require('./contact');

setInterval(() => { contact.getUserListRaw().forEach(user => { user.socketCheck(); }); }, 1000 * 1); // seconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.bufferCheck(); }); }, 1000 * 0.01); // seconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.sendAlive(); }); }, 1000 * 30); // seconds
setInterval(() => { contact.getUserListRaw().forEach(user => { user.fileTransCheck(); }); }, 10); // milliseconds

class User {
    constructor(hostname) {
        this.hostname = hostname;
        this.valid = false;
        this.destroyed = false;
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
        this.bufferIn = "";

        this.messageList = [];
        this.lastMessageDate = new Date();

        this.fileSendList = [];
        this.fileRecvList = [];

        this.eventEmitter = new EventEmitter();
    }

    socketCheck() {
        if (!this.socketOut && this.socketOutConnecting == false && this.socketOutRetryWait == false) {
            if (contact.isFriend(this.hostname) || this.income) {
                this.income = false;
                console.log("Try connecting to server");
                this.socketOutConnecting = true;
                this.connect()
                    .then((socket) => {
                        this.setSocketOut(socket);
                        console.log("Connect success");
                        this.socketOutConnecting = false;
                    })
                    .catch((err) => {
                        console.log("Connect failed: ", err);
                        this.socketOutConnecting = false;
                        this.closeSocketOut();
                    })
            }
        }

        if (this.sendPongReq) {
            this.sendPong();
        }

        if (!this.socketOut || !this.socketIn || !this.valid) {
            this.status = 0;
        }

        if (this.bufferOut > config.BufferMaximum || this.bufferIn > config.BufferMaximum) {
            destroy();
        }
    }

    connect() {
        let options = config.ProxyOptions;
        options.destination.host = this.hostname + ".onion";

        return new Promise((resolve, reject) => {
            SocksClient.createConnection(options)
                .then((info) => {
                    resolve(info.socket);
                })
                .catch((err) => {
                    reject(err);
                })
        })
    }

    closeSocketOut() {
        if (this.socketOut && !this.socketOut.destroyed) { this.socketOut.destroy(); }
        this.eventEmitter.emit('close');

        this.socketOut = null;
        this.socketOutConnecting = false;
        this.socketOutRetryWait = true;
        this.bufferOut = "";

        setTimeout(() => { this.socketOutRetryWait = false; }, config.ConnectionRetryTime);
    }

    closeSocketIn() {
        if (this.socketIn && !this.socketIn.destroyed) { this.socketIn.destroy(); }
        this.eventEmitter.emit('close');

        this.socketIn = null;
        this.bufferIn = "";
    }

    destroy() {
        this.closeSocketOut();
        this.closeSocketIn();
        this.destroyed = true;
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
            this.valid = false;
            this.destroy();
        }
        else {
            this.valid = true;
            this.eventEmitter.emit('connect');

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
            console.log('error from server [timeout]');
            this.closeSocketOut();
        });

        protocol.ping(this.socketOut, tor.getHostname(), this.randomStr);

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
            console.log('error from client [timeout]');
            this.closeSocketIn();
        });

        this.socketIn.on('data', (data) => {
            this.bufferIn += data.toString();
        });
    }

    hasIncome(randomStrPong) {
        this.income = true;
        this.socketOutRetryWait = false;

        this.randomStrPong = randomStrPong;
        this.sendPongReq = true;
    }

    bufferCheck() {
        if (this.bufferIn && this.bufferIn.length > 0) {
            let hostname, randomStrPong, clientName, clientVersion;
            let status, profileName, profileInfo;
            let message;
            let fileID, fileSize, fileName, blockIndex;

            while (this.bufferIn.indexOf('\n') > -1) {
                let parsed = parser.buffer(this.bufferIn);
                const dataList = parsed.dataList;
                this.bufferIn = parsed.bufferAfter;

                if (!protocol.validate(dataList)) { continue; }
                switch (dataList[0]) {
                    case 'ping':
                        hostname = dataList[1];
                        randomStrPong = dataList[2];
                        if (this.hostname != hostname) {
                            console.log("something wrong");
                            this.destroy();
                        }

                        this.randomStrPong = randomStrPong;
                        this.sendPongReq = true;
                        break;

                    case 'pong':
                        randomStrPong = dataList[1];
                        clientName = dataList[2];
                        clientVersion = dataList[3];

                        this.validate(randomStrPong);
                        this.clientName = clientName;
                        this.clientVersion = clientVersion;
                        break;

                    case 'alive':
                        status = dataList[1];
                        this.status = status * 1;

                        this.eventEmitter.emit('alive');
                        break;

                    case 'profile':
                        profileName = dataList[1];
                        profileInfo = dataList[2];

                        this.profileName = parser.unescape(profileName);
                        this.profileInfo = parser.unescape(profileInfo);
                        
                        this.eventEmitter.emit('profile');
                        break;

                    case 'message':
                        message = dataList[1];
                        this.pushMessage(parser.unescape(message), { fromMe: false });
                        break;

                    case 'filesend':
                        fileID = dataList[1];
                        fileSize = dataList[2] * 1;
                        fileName = parser.unescape(dataList[3]);

                        this.pushMessage(fileName, { fromMe: false, isFile: true, fileSize: fileSize });
                        this.pushFileRecvList(fileID, fileSize);

                        break;
                    case 'fileaccept':
                        fileID = dataList[1];

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

                    case 'filecancle':
                        fileID = dataList[1];

                        this.fileCancle(fileID);
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
                            this.sendFileCancle(fileID);
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

        protocol.pong(this.socketOut, this.randomStrPong, config.ClientName, config.ClientVersion);
        this.sendPongReq = false;
    }

    sendAlive() {
        if (!this.isValid()) { return; }

        protocol.alive(this.socketOut, config.userStatus);
    }

    sendProfile() {
        if (!this.isValid()) { return; }

        protocol.profile(this.socketOut, config.profileName, config.profileInfo);
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
        
        this.eventEmitter.emit('message', message, options);

        while (this.messageList.length > config.chatListSize) {
            this.messageList.shift();
        }
    }

    sendFileSend(file) { //interface
        return new Promise((resolve, reject) => {
            if (!this.isValid()) { reject(new Error("Not connected")); return; }
            if (!fs.existsSync(file)) { reject(new Error("File not exist")); return; }
            const stat = fs.statSync(file);
            if (!stat.isFile()) { reject(new Error("Not a File")); return; }
            if (stat.size <= 0) { reject(new Error("File size zero")); return; }

            const fileID = crypto.randomBytes(20).toString('hex');
            const fileName = path.basename(file);
            const fileSize = stat.size;

            this.pushMessage(fileName, { fromMe: true, isFile: true, fileSize: fileSize });
            this.pushFileSendList(fileID, file);

            protocol.filesend(this.socketOut, fileID, fileSize, fileName);

            resolve();
        });
    }

    pushFileSendList(fileID, file) {
        this.fileSendList.push({
            fileID, file,
            accepted: false, finished: false,
            sendBlock: 0, sendSize: 0, okayBlock: -1, okayList: [],
            bufferSize: 0,
        })
    }

    pushFileRecvList(fileID, fileSize) {
        this.fileRecvList.push({
            fileID, fileSize,
            accepted: false, finished: false,
            bufferList: {}, recvSize: 0, blockIndex: 0, blockWriting: false
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
                this.eventEmitter.emit('fileaccept', fileID);
            }
        });
    }

    acceptFileRecv(fileID) {
        this.fileRecvList.forEach(fileRecv => {
            if (fileRecv.fileID == fileID) {
                fileRecv.accepted = true;
            }
        });
    }

    sendFileOkay(fileID, blockIndex) {
        protocol.fileokay(this.socketOut, fileID, blockIndex);
    }

    sendFileError(fileID, blockIndex) {
        protocol.fileerror(this.socketOut, fileID, blockIndex);
    }

    sendFileCancle(fileID) {
        protocol.filecancle(this.socketOut, fileID);
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
                filesend.okayList[blockIndex] = true;

                for (let index = 0; index <= blockIndex; index++) {
                    if (filesend.okayList[index]) {
                        filesend.okayBlock = index;
                    }
                    else {
                        break;
                    }
                }

                const blockNum = fileHandler.getBlockNum(filesend.file, config.FileBlockSize);
                if (blockNum - 1 <= filesend.okayBlock) {
                    filesend.finished = true;
                }
                this.eventEmitter.emit('fileupdate', filesend.fileID);
            }
        });
    }

    fileError(fileID, blockIndex) {
        this.fileSendList.forEach(filesend => {
            if (filesend.fileID == fileID) {
                if (blockIndex < filesend.sendBlock) {
                    filesend.sendBlock = blockIndex;
                }
            }
        });
    }

    fileCancle(fileID) { //interface
        this.fileSendList = this.fileSendList.filter((filesend) => {
            if (filesend.fileID == fileID) {
                return false;
            }
            return true;
        })
    }

    fileTransCheck() {
        if (this.isValid()) {
            this.fileSendList.forEach(filesend => {
                if (filesend.accepted) {
                    const blockNum = fileHandler.getBlockNum(filesend.file, config.FileBlockSize);
                    while (filesend.accepted && filesend.sendBlock < blockNum && filesend.bufferSize < config.fileBufferSize) {
                        filesend.bufferSize += config.FileBlockSize;
                        fileHandler.readFileBlock(filesend.file, config.FileBlockSize, filesend.sendBlock)
                            .then((data) => {
                                const blockIndex = data.index;
                                const blockHash = fileHandler.getMD5(data.buffer);
                                const blockData = data.buffer;

                                filesend.sendSize += blockData.length;
                                protocol.filedata(this.socketIn, filesend.fileID, blockIndex, blockHash, blockData)
                                    .then((sentSize) => {
                                        filesend.bufferSize -= config.FileBlockSize;
                                    })
                            })
                            .catch((err) => {
                                console.log(err);
                                filesend.bufferSize -= config.FileBlockSize;
                                filesend.accepted = false;
                                this.eventEmitter.emit('fileupdate', filesend.fileID);
                            })
                        filesend.sendBlock += 1;
                    }

                    if (blockNum <= filesend.sendBlock) {
                        filesend.accepted = false;
                        this.eventEmitter.emit('fileupdate', filesend.fileID);
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

                        delete filerecv.bufferList[filerecv.blockIndex];
                        filerecv.blockIndex += 1;
                    }
                    this.eventEmitter.emit('fileupdate', filerecv.fileID);

                    if (bufferSum.length > 0) {
                        filerecv.blockWriting = true;
                        if (createFile) { fileHandler.writeFileClear(fileName); }
                        fileHandler.writeFileAppend(fileName, bufferSum)
                            .then(() => {
                                filerecv.blockWriting = false;
                            })
                            .catch((err) => {
                                console.log(err);
                                filerecv.blockWriting = false;
                                filerecv.accepted = false;
                                this.eventEmitter.emit('fileupdate', filerecv.fileID);
                            })

                        if (filerecv.fileSize <= filerecv.recvSize) {
                            filerecv.accepted = false;
                            filerecv.finished = true;
                            this.eventEmitter.emit('fileupdate', filerecv.fileID);
                        }
                    }
                }
            })
        }
    }
}
module.exports = User;