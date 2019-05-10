'use strict';

const EventEmitter = require('events');
const fs = require('fs');

const fileHandler = require(`${__base}/core/fileIO/fileHandler`);
const debug = require(`${__base}/core/debug`);

class FileRecvList extends EventEmitter {
    constructor() {
        super();

        this.fileList = [];
    }

    push(fileID, fileSize) {
        this.fileList.push({
            fileID, fileSize,
            accepted: false, finished: false,
            bufferList: {}, recvSize: 0, tempSize: 0, speedSize: 0,
            blockIndex: 0, blockWriting: false
        })
    }

    hasFile(fileID) {
        let fileIndex = -1;
        this.fileList.forEach((aFile, index) => {
            if (aFile.fileID === fileID) { fileIndex = index; }
        });
        if (-1 < fileIndex) { return true; }
        return false;
    }

    isFinished(fileID) {
        let finished = false;
        this.fileList.forEach((aFile) => {
            if (aFile.fileID === fileID && aFile.finished) { finished = true; }
        });
        return finished;
    }

    acceptFile(fileID) {
        this.fileList.forEach(aFile => {
            if (aFile.fileID === fileID) {
                aFile.accepted = true;
                this.emit('accept', fileID);
            }
        });
    }

    fileCancel(fileID) {
        let changed = false;
        this.fileList = this.fileList.filter((aFile) => {
            if (aFile.fileID === fileID) {
                this.emit('cancel', fileID);
                changed = true;
                return false;
            }
            return true;
        })
        return changed;
    }

    filedata(fileID, blockIndex, blockData) {
        this.fileList.forEach(aFile => {
            if (aFile.fileID === fileID && aFile.accepted) {
                aFile.bufferList[blockIndex] = blockData;
            }
        });
    }

    saveFile(fileID, toFilePath) {
        return new Promise((resolve, reject) => {
            let fromFilePath = fileHandler.getTempDir() + '/' + fileID;
            if (fs.existsSync(fromFilePath)) {
                fileHandler.move(fromFilePath, toFilePath)
                    .then(() => {
                        this.emit('saved', fileID);
                        resolve();
                    })
                    .catch((err) => {
                        reject(err);
                    })
            }
            else {
                reject(new Error('no downloaded temp file'));
            }
        })
    }

    fileFreeTimeout(fileID) {
        setTimeout(() => {
            this.fileList = this.fileList.filter((file) => {
                if (file.fileID === fileID) { return false; }
                return true;
            })
        }, 1000 * 10)
    }

    fileTransCheck() {
        this.fileList.forEach(filerecv => {
            if (filerecv.accepted && filerecv.blockWriting === false && Object.keys(filerecv.bufferList).length > 0) {
                let bufferSum = "";
                let filePath = fileHandler.getTempDir() + '/' + filerecv.fileID;
                let createFile = false;
                if (filerecv.blockIndex === 0) { createFile = true; }

                while (filerecv.bufferList[filerecv.blockIndex]) {
                    bufferSum += filerecv.bufferList[filerecv.blockIndex]

                    filerecv.recvSize += filerecv.bufferList[filerecv.blockIndex].length;
                    filerecv.tempSize += filerecv.bufferList[filerecv.blockIndex].length;

                    delete filerecv.bufferList[filerecv.blockIndex];
                    filerecv.blockIndex += 1;
                }

                if (bufferSum.length > 0) {
                    filerecv.blockWriting = true;
                    if (createFile) { fileHandler.writeFileClear(filePath); }
                    fileHandler.writeFileAppend(filePath, bufferSum)
                        .then((recvSize) => {
                            filerecv.blockWriting = false;
                        })
                        .catch((err) => {
                            debug.log(err);
                            filerecv.blockWriting = false;
                            filerecv.accepted = false;
                            this.emit('error', filerecv.fileID);
                        })
                }
            }

            if (filerecv.fileSize <= filerecv.recvSize && filerecv.blockWriting === false) {
                filerecv.accepted = false;
                filerecv.finished = true;
                this.fileFreeTimeout(filerecv.fileID);
                this.emit('finished', filerecv.fileID);
            }
        })
    }

    fileDataCheck() {
        this.fileList.forEach(filerecv => {
            if ((filerecv.accepted || filerecv.finished) && filerecv.tempSize > 0) {
                this.emit('data', filerecv.fileID, filerecv.recvSize);

                filerecv.speedSize += filerecv.tempSize;
                filerecv.tempSize = 0;
            }
        });
    }

    fileSpeedCheck() {
        this.fileList.forEach(filerecv => {
            if ((filerecv.accepted || filerecv.finished) && filerecv.speedSize > 0) {
                const speed = filerecv.speedSize;
                this.emit('speed', filerecv.fileID, speed);

                filerecv.speedSize = 0;
            }
        });
    }

    destroy() {
        this.removeAllListeners();
    }
}
module.exports = FileRecvList