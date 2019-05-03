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

const debug = require('./debug');

class SocksOut extends EventEmitter {
    constructor(socket, buffer) {
        super();

        this.socket = socket;
        this.buffer = buffer;

        this.socket.on('close', () => { debug.log('[socket OUT] close'); this.close(); })
        this.socket.on('timeout', () => { debug.log('[socket OUT] timeout'); this.close(); })
        this.socket.on('error', (err) => { debug.log('[socket OUT] error:', err); this.close(); })

        this.socket.on('data', (data) => { this.data(data); })
    }

    data(data) {
        const dataStr = data.toString();
        if (dataStr.length <= 0) { return; }
        this.buffer += dataStr;

        if (this.buffer.length > constant.BufferMaximum) { this.emit('invalid'); }

        if (this.buffer.length > 0) {
            let fileID, blockIndex, blockHash, blockData;

            while (this.bufferOut.indexOf('\n') > -1) {
                const parsedBuffer = parser.buffer(this.buffer);
                const dataList = parsedBuffer.dataList;
                this.buffer = parsedBuffer.leftBuffer;

                if (!protocol.validate(dataList)) { continue; }
                switch (dataList[0]) {
                    case 'filedata':
                        fileID = dataList[1];
                        blockIndex = dataList[2] * 1;
                        blockHash = dataList[3];
                        blockData = parser.unescape(dataList[4]);

                        if (fileHandler.getMD5(blockData) == blockHash) {
                            this.emit('filedata', fileID, blockIndex, blockHash, blockData);
                        }
                        else {
                            this.emit('filedataerror', fileID, blockIndex, blockHash, blockData);
                        }

                        break;

                    default:
                        debug.log("Unknown instruction[out]: ", dataList);
                        break;
                }
            }
        }
    }

    sendPing(cookie) {
        const keyPair = tor.getKeyPair();
        const publicKeyStr = keyPair.public.toString('base64');
        const signed = torUtil.sign(publicKeyStr + cookie, keyPair.public, keyPair.secret);
        const signedStr = signed.toString('base64');
        protocol.ping(this.socket, publicKeyStr, cookie, signedStr);
    }

    sendPong(cookieOppsite) {
        protocol.pong(this.socket, cookieOppsite, constant.ClientName, constant.ClientVersion);
    }

    sendAlive() {
        protocol.alive(this.socket, config.getSetting().userStatus);
    }

    sendProfile() {
        protocol.profile(this.socket, config.getSetting().profileName, config.getSetting().profileInfo);
    }

    sendMessage(message) {
        protocol.message(this.socket, message);
    }

    sendFilesend(fileID, fileSize, fileName) {
        protocol.filesend(this.socket, fileID, fileSize, fileName);
    }

    sendFileaccept(fileID) {
        protocol.fileaccept(this.socket, fileID);
    }

    sendFileOkay(fileID, blockIndex) {
        protocol.fileokay(this.socket, fileID, blockIndex);
    }

    sendFileCancel(fileID) {
        protocol.filecancel(this.socket, fileID);
    }

    sendFileError(fileID, blockIndex) {
        protocol.fileerror(this.socket, fileID, blockIndex);
    }

    close() {
        if (this.socket && !this.socket.destroyed) { this.socket.destroy(); }
        if (this.socket) {
            debug.log("[socket OUT] Closed");

            this.socket = null;
            this.buffer = "";

            this.emit('close');
        }
    }
    
    destroy() {
        if (this.socket && !this.socket.destroyed) { this.socket.destroy(); }
        this.socket = null;
    }
}
module.exports = SocksOut;