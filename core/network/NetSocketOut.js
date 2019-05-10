'use strict';

const SocksClient = require('socks').SocksClient;
const crypto = require("crypto");
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const config = require(`${__base}/core/config`);
const constant = require(`${__base}/core/constant`);

const tor = require(`${__base}/tor/tor`);
const torUtil = require(`${__base}/tor/torUtils`)

const parser = require(`${__base}/core/network/parser`);
const protocol = require(`${__base}/core/network/protocol`);
const fileHandler = require(`${__base}/core/fileIO/fileHandler`);
const contact = require(`${__base}/core/contact`);
const debug = require(`${__base}/core/debug`);

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
        const dataStr = data.toString('binary');
        if (dataStr.length <= 0) { return; }
        this.buffer += dataStr;

        if (this.buffer.length > constant.BufferMaximum) { this.emit('invalid'); }

        if (this.buffer.length > 0) {
            let fileID, blockIndex, blockHash, blockData;

            while (this.buffer.indexOf('\n') > -1) {
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
                            this.emit('filedata', fileID, blockIndex, blockData);
                        }
                        else {
                            this.sendFileError(fileID, blockIndex);
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
        const publicKeyStr = keyPair.publicKey.toString('base64');
        const signed = torUtil.sign(publicKeyStr + cookie, keyPair.publicKey, keyPair.secretKey);
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
        debug.log("[socket OUT] Closed");
        this.emit('close');
        if (this.socket) {
            if (!this.socket.destroyed) { this.socket.destroy(); }
            this.buffer = "";
            this.socket = null;
        }
    }

    destroy() {
        if (this.socket) {
            if (!this.socket.destroyed) { this.socket.destroy(); }
            this.buffer = "";
            this.socket = null;
        }
        this.removeAllListeners();
    }
}
module.exports = SocksOut;