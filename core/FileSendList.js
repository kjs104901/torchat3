const EventEmitter = require('events');
const constant = require('../constant');
const fileHandler = require('./fileHandler');
const debug = require('./debug');

class FileSendList extends EventEmitter {
    constructor() {
        super();

        this.fileList = [];
        this.socketDrain = true;
    }

    push(fileID, file, fileSize) {
        this.fileList.push({
            fileID, file, fileSize,
            accepted: false, finished: false,
            sendBlock: 0, sendSize: 0, tempSize: 0, speedSize: 0,
            okayBlock: -1, okayList: [],
            bufferSize: 0,
        })
    }

    accpetFile(fileID) {
        this.fileList.forEach(fileSend => {
            if (fileSend.fileID == fileID) {
                fileSend.accepted = true;
                this.emit('accept', fileID);
            }
        });
    }

    fileOkay(fileID, blockIndex) {
        this.fileList.forEach(filesend => {
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
                    else { break; }
                }

                if (blockNum - 1 <= filesend.okayBlock) {
                    filesend.accepted = false;
                    filesend.finished = true;
                    this.fileSlowFree(filesend.fileID);
                    this.emit('finished', filesend.fileID);
                }
            }
        });
    }


    fileError(fileID, blockIndex) {
        this.fileList.forEach(filesend => {
            if (filesend.fileID == fileID) {
                if (blockIndex < filesend.sendBlock) {
                    filesend.sendBlock = blockIndex;
                }
            }
        });
    }

    fileCancel(fileID) {
        let changed = false;
        this.fileList = this.fileList.filter((aFile) => {
            if (aFile.fileID == fileID) {
                this.emit('cancel', fileID);
                changed = true;
                return false;
            }
            return true;
        })
        return changed;
    }

    fileSlowFree(fileID) {
        setTimeout(() => {
            this.fileList = this.fileList.filter((file) => {
                if (file.fileID == fileID) { return false; }
                return true;
            })
        }, 1000 * 10)
    }

    setSocketDrain(drain) { this.socketDrain = drain; }

    fileTransCheck() {
        let sendFirstFile = false;
        this.fileList.forEach(filesend => {
            if (filesend.accepted && !sendFirstFile) {
                const blockNum = fileHandler.getBlockNum(filesend.file, constant.FileBlockSize);
                while (filesend.accepted && filesend.sendBlock < blockNum && filesend.sendBlock < filesend.okayBlock + constant.FileBlockWindow
                    && filesend.bufferSize < constant.FileBufferSize && this.socketDrain) {
                    filesend.bufferSize += constant.FileBlockSize;
                    fileHandler.readFileBlock(filesend.file, constant.FileBlockSize, filesend.sendBlock)
                        .then((data) => {
                            const blockIndex = data.index;
                            const blockData = data.buffer;

                            filesend.bufferSize -= constant.FileBlockSize;

                            this.emit('senddata', filesend.fileID, blockIndex, blockData);
                        })
                        .catch((err) => {
                            debug.log(err);
                            filesend.bufferSize -= constant.FileBlockSize;
                            filesend.accepted = false;
                            this.emit('error', filesend.fileID);
                        })
                    filesend.sendBlock += 1;
                }
                if (filesend.accepted && !filesend.finished) {
                    sendFirstFile = true;
                }
            }
        });
    }

    fileDataCheck() {
        this.fileList.forEach(filesend => {
            if ((filesend.accepted || filesend.finished) && filesend.tempSize > 0) {
                this.emit('data', filesend.fileID, filesend.sendSize);

                filesend.speedSize += filesend.tempSize;
                filesend.tempSize = 0;
            }
        });
    }

    fileSpeedCheck() {
        this.fileList.forEach(filesend => {
            if ((filesend.accepted || filesend.finished) && filesend.speedSize > 0) {
                const speed = filesend.speedSize;
                this.emit('speed', filesend.fileID, speed);

                filesend.speedSize = 0;
            }
        });
    }
}
module.exports = FileSendList