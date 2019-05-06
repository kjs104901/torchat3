const fs = require('fs');
const crypto = require("crypto");
const { SHA3 } = require('sha3');
const base32 = require("base32.js");
const child_process = require('child_process');

const supercop = require('supercop.js')

const config = require(`${__base}/core/config`);

const torDir = __dirname + "/bin";
const hiddenServiceDir = torDir + "/hidden_service";

exports.generateKeyPair = () => {
    let secret, public;

    const secretKeyDir = hiddenServiceDir + "/secretKey";
    const publicKeyDir = hiddenServiceDir + "/publicKey";

    if (!fs.existsSync(hiddenServiceDir)) { fs.mkdirSync(hiddenServiceDir) }

    if (fs.existsSync(secretKeyDir) && fs.existsSync(publicKeyDir)) { // already exists
        try {
            secret = fs.readFileSync(secretKeyDir);
            public = fs.readFileSync(publicKeyDir);
            return { secret, public }
        } catch (error) {
            return;
        }
    }
    else {
        const keyPair = supercop.createKeyPair(supercop.createSeed());
        secret = keyPair.secretKey;
        public = keyPair.publicKey;
        try {
            fs.writeFileSync(secretKeyDir, secret);
            fs.writeFileSync(publicKeyDir, public);
            return { secret, public }
        } catch (error) {
            return;
        }
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
    return supercop.sign(Buffer.from(content), publicKey, secretKey);
}

exports.verify = (content, signature, publicKey) => {
    return supercop.verify(signature, Buffer.from(content), publicKey);
}

exports.generateControlPassword = () => {
    try {
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
    } catch (error) {
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
    } catch (error) { }
}