const fs = require('fs');
const crypto = require("crypto");
const ed = require('ed25519-supercop');
const { SHA3 } = require('sha3');
const base32 = require("base32.js");
const child_process = require('child_process');

const config = require('../config');

const torDir = __dirname + "/bin";
const hiddenServiceDir = torDir + "/hidden_service";

exports.generateKeyPair = () => {
    let secret, public;

    const secretKeyDir = hiddenServiceDir + "/secretKey";
    const publicKeyDir = hiddenServiceDir + "/publicKey";

    if (!fs.existsSync(hiddenServiceDir)) { fs.mkdirSync(hiddenServiceDir) }

    if (fs.existsSync(secretKeyDir) && fs.existsSync(publicKeyDir)) { // already exists
        secret = fs.readFileSync(secretKeyDir);
        public = fs.readFileSync(publicKeyDir);
        return { secret, public }
    }
    else {
        const keyPair = ed.createKeyPair(Buffer.alloc(32, crypto.randomBytes(32)));
        secret = keyPair.secretKey;
        public = keyPair.publicKey;
        fs.writeFileSync(secretKeyDir, secret);
        fs.writeFileSync(publicKeyDir, public);
        return { secret, public }
    }
}

exports.generateHostname = (publicKey) => {
    const salt = Buffer.alloc(".onion checksum".length, ".onion checksum");
    const version = Buffer.alloc(1, 3);

    const hash = new SHA3(256);
    hash.update(Buffer.concat([salt, publicKey, version]));
    const checksum = hash.digest().slice(0, 2);

    const base32Encoder = new base32.Encoder({ type: "rfc4648", lc: true });
    return base32Encoder.write(Buffer.concat([publicKey, checksum, version])).finalize();
}

exports.sign = (content, publicKey, secretKey) => {
    return ed.sign(content, publicKey, secretKey);
}

exports.verify = (content, signature, publicKey) => {
    return ed.verify(signature, content, publicKey)
}

exports.generateControlPassword = () => {
    const controlPassword = crypto.randomBytes(20).toString('hex');
    let controlPasswordHashed;

    const execString = child_process.execFileSync(torDir + '/tor.exe',
        ['--hash-password', controlPassword],
        { cwd: torDir, encoding: 'utf8' });

    if (execString.length <= 0) { return; }
    const execList = execString.split('\n');
    execList.forEach(line => {
        if (line.indexOf('16:') == 0) {
            controlPasswordHashed = line.replace('\r', '');
        }
    });
    if (!controlPasswordHashed) { return; }

    return {
        string: controlPassword,
        hashed: controlPasswordHashed
    };
}


exports.makeTorrc = (controlPassword) => {
    let bridgeLine = '';
    if (config.getSetting().bridge == 1) { bridgeLine = "Bridge " + config.getSetting().bridge; }

    fs.writeFileSync(__dirname + '/torrc',
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