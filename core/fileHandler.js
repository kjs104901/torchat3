var os = require('os');
const fs = require('fs');
const crypto = require('crypto');

function isFile(file) {
    const stats = fs.statSync(file);
    if (stats.isFile()) { return true; }
    return false;
}
exports.isFile = isFile;

function getSize(file) {
    const stats = fs.statSync(file);
    return stats.size;
}
exports.getSize = getSize;

function getBlockNum(file, blockSize) {
    if (isFile(file)) {
        return Math.ceil(getSize(file) / blockSize);
    }
    return 0;
}
exports.getBlockNum = getBlockNum;


function readFileBlock(file, blockSize, index) {
    return new Promise((resolve, reject) => {
        let bufferTemp = "";
        const start = blockSize * index;
        const end = start + blockSize - 1;

        const readStream = fs.createReadStream(file, {
            encoding: "binary",
            start, end
        });

        readStream.on('readable', () => { readStream.read(); });
        readStream.on('data', (chunk) => { bufferTemp += chunk; });
        readStream.on('error', (err) => { reject(err) });
        readStream.on('end', () => {
            resolve({ index: index, buffer: bufferTemp });
        });
    })
}
exports.readFileBlock = readFileBlock;

function getMD5(targetStr) {
    return crypto.createHash('md5').update(targetStr).digest("hex");
}
exports.getMD5 = getMD5;

// creating temp directory
let tempDirBase = os.tmpdir() + "/torchat3";
let tempDirCount = 0;
while (fs.existsSync(tempDirBase + "_" + tempDirCount) && !fs.lstatSync(tempDirBase + "_" + tempDirCount).isDirectory()) {
    tempDirCount += 1;
}
if (!fs.existsSync(tempDirBase + "_" + tempDirCount)) {
    fs.mkdirSync(tempDirBase + "_" + tempDirCount);
}

function getTempDir() {
    return tempDirBase + "_" + tempDirCount;
}
exports.getTempDir = getTempDir;

function writeFileClear(file) {
    try {
        fs.writeFileSync(file, '');

    } catch (error) { }
}
exports.writeFileClear = writeFileClear;

function writeFileAppend(file, block) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(file)) {
            fs.appendFile(file, block, { encoding: 'binary' }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(block.length);
                }
            })
        }
        else {
            reject(new Error("no such file"));
        }
    });
}
exports.writeFileAppend = writeFileAppend;

function move(oldPath, newPath) {
    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    const readStream = fs.createReadStream(oldPath);
                    const writeStream = fs.createWriteStream(newPath);

                    readStream.on('error', (err) => { reject(err) });
                    writeStream.on('error', (err) => { reject(err) });

                    readStream.on('close', () => {
                        fs.unlink(oldPath, (err) => {
                            if (err) { reject(err); }
                            else { resolve(); }
                        });
                    });
                    readStream.pipe(writeStream);
                } else {
                    reject(err);
                }
            }
            else {
                resolve();
            }
        });
    })
}
exports.move = move;