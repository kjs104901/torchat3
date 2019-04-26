const fs = require('fs');
const crypto = require('crypto');

function getBlockNum(file, blockSize) {
    const stats = fs.statSync(file);
    if (stats.isFile()) {
        return Math.ceil(stats.size / blockSize);
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

function writeFileClear(file) {
    fs.writeFileSync(file, '');
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
                    resolve();
                }
            })
        }
        else {
            reject(new Error("no such file"));
        }
    });
}
exports.writeFileAppend = writeFileAppend;