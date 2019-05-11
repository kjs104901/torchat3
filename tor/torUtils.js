'use strict';

const fs = require('fs');
const crypto = require("crypto");
const { SHA3 } = require('sha3');
const base32 = require("base32.js");
const child_process = require('child_process');

const supercop = require('supercop.js')

const config = require(`${__base}/core/config`);

const torDir = fixPathForAsarUnpack(__dirname + "/bin");
const hiddenServiceDir = torDir + "/hidden_service";

function fixPathForAsarUnpack(targetPath) {
    const isElectron = 'electron' in process.versions;
    const isUsingAsar = isElectron && process.mainModule && process.mainModule.filename.includes('app.asar');

    if (isUsingAsar) {
        return targetPath.replace('app.asar', 'app.asar.unpacked');
    }
    return targetPath;
}

exports.generateKeyPair = () => {
    let secretKey, publicKey;

    const keyPairPath = hiddenServiceDir + '/keyPair';

    try {
        if (!fs.existsSync(hiddenServiceDir)) { fs.mkdirSync(hiddenServiceDir) }

        if (fs.existsSync(keyPairPath)) { // already exists

            const keyJsonStr = fs.readFileSync(keyPairPath, 'utf8');
            const keyJson = JSON.parse(keyJsonStr);
            secretKey = Buffer.from(keyJson.secretKey, 'base64');
            publicKey = Buffer.from(keyJson.publicKey, 'base64');

            const testMsg = Buffer.from("testMsg");
            const testSig = supercop.sign(testMsg, publicKey, secretKey)

            if (supercop.verify(testSig, testMsg, publicKey)) {
                return { secretKey, publicKey }
            }
        }
        else {
            const keyPair = supercop.createKeyPair(supercop.createSeed());
            secretKey = keyPair.secretKey;
            publicKey = keyPair.publicKey;

            fs.writeFileSync(keyPairPath, JSON.stringify({
                secretKey: secretKey.toString('base64'),
                publicKey: publicKey.toString('base64')
            }), 'utf8')

            return { secretKey, publicKey }
        }
    } catch (error) {
        console.log(error);
        return;
    }
}

exports.exportKeyPair = (filePath) => {
    const keyPairPath = hiddenServiceDir + '/keyPair';
    
    fs.copyFile(keyPairPath, filePath, (err) => {
        if (err) { console.log(err);}
    });
}

exports.importKeyPair = (filePath) => {
    const keyPairPath = hiddenServiceDir + '/keyPair';
    
    fs.copyFile(filePath, keyPairPath, (err) => {
        if (err) { console.log(err);}
    });
}

exports.generateHostname = (publicKey) => {
    const saltStr = ".onion checksum";
    const salt = Buffer.alloc(saltStr.length, saltStr);
    const version = Buffer.alloc(1, 3);

    const hash = new SHA3(256);
    hash.update(Buffer.concat([salt, publicKey, version]));
    const checksum = hash.digest().slice(0, 2);

    const base32Encoder = new base32.Encoder({ type: "rfc4648", lc: true });
    return base32Encoder.write(Buffer.concat([publicKey, checksum, version])).finalize();
}

exports.sign = (content, publicKey, secretKey) => {
    return supercop.sign(Buffer.from(content), publicKey, secretKey);
}

exports.verify = (content, signature, publicKey) => {
    return supercop.verify(signature, Buffer.from(content), publicKey);
}

exports.generateControlPassword = () => {
    try {
        const controlPassword = crypto.randomBytes(20).toString('hex');
        let controlPasswordHashed;
        let execString;

        for (let index = 0; index < 3; index++) {
            if (!controlPasswordHashed) {
                execString = child_process.execFileSync(torDir + '/tor.exe',
                    ['--hash-password', controlPassword],
                    { cwd: torDir, encoding: 'utf8' });

                if (execString.length > 0) {
                    const execList = execString.split('\n');
                    execList.forEach(line => {
                        if (line.indexOf('16:') === 0) {
                            controlPasswordHashed = line.replace('\r', '');
                        }
                    });
                }
            }
        }

        if (!controlPasswordHashed) { return; }
        return {
            string: controlPassword,
            hashed: controlPasswordHashed
        };
    } catch (error) {
        console.log(error);
        return;
    }
}


exports.makeTorrc = (controlPassword) => {
    let bridgeLine = '';
    if (config.getSetting().useBridge) { bridgeLine = "Bridge " + config.getSetting().bridge; }
    try {
        fs.writeFileSync(torDir + '/torrc',
            `
SocksPort auto
ControlPort auto
ControlPortWriteToFile ${torDir}/data/controlPort
HashedControlPassword ${controlPassword.hashed}

UseBridges ${config.getSetting().useBridge ? '1' : '0'}
${bridgeLine}

DataDirectory ${torDir}/data
GeoIPFile ${torDir}/data/geoip
GeoIPv6File ${torDir}/data/geoipv6
` + config.getSetting().torrcExpand);
    }
    catch (error) {
        console.log(error);
    }
}