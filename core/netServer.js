const net = require('net');
const config = require('../config');
const constant = require('../constant');
const contact = require('./contact');
const netUserList = require('./netUserList');
const protocol = require('./protocol');
const parser = require('./parser');
const debug = require('./debug');

const torUtil = require('../tor/torUtils')

let server = net.createServer((client) => {
    let dataBuffer = "";
    let arrivedPong;

    debug.log('[Server] Client connection in');
    client.setTimeout(constant.ConnectionTimeOut);
    client.setKeepAlive(true, constant.KeepAliveTime);

    let publicKeyStr, publicKey, signedStr, signed,
        hostname, cookieOppsite, clientName, clientVersion;
    client.on('data', (data) => {
        dataBuffer += data.toString();
        if (dataBuffer.length > constant.BufferMaximum) {
            dataBuffer = "";

            if (client && !client.destroyed) {
                client.destroy(); client = null;
            }
        }
        else {
            while (dataBuffer.indexOf('\n') > -1) {
                let parsed = parser.buffer(dataBuffer);
                const dataList = parsed.dataList;
                dataBuffer = parsed.leftBuffer;

                if (!protocol.validate(dataList)) { continue; }
                switch (dataList[0]) {
                    case 'ping':
                        publicKeyStr = dataList[1];
                        publicKey = Buffer.from(publicKeyStr, 'base64');
                        cookieOppsite = dataList[2];
                        signedStr = dataList[3];
                        signed = Buffer.from(signedStr, 'base64');

                        hostname = torUtil.generateHostname(publicKey);
                        if ((torUtil.verify(publicKeyStr + cookieOppsite, signed, publicKey)) &&
                            (!config.getSetting().blackList || !contact.isBlack(hostname)) &&
                            (!config.getSetting().whiteList || contact.isWhite(hostname))) {
                            const targetUser = netUserList.addUser(hostname);
                            if (targetUser) {
                                client.removeAllListeners();
                                targetUser.setSocketIn(client, dataBuffer);
                                targetUser.reserveSendPong(cookieOppsite);
                                if (arrivedPong) {
                                    targetUser.pongValidate(arrivedPong.cookieOppsite, arrivedPong.clientName, arrivedPong.clientVersion);
                                }
                            }
                        }
                        else {
                            debug.log("key varify failed");
                            if (client && !client.destroyed) {
                                client.destroy(); client = null;
                            }
                        }
                        break;

                    case 'pong':
                        cookieOppsite = dataList[1];
                        clientName = dataList[2];
                        clientVersion = dataList[3];

                        arrivedPong = {
                            cookieOppsite, clientName, clientVersion
                        }
                        debug.log("pong arrived before ping");
                        break;

                    case 'loopback':
                        protocol.loopback(client);

                    default:
                        debug.log("Unknown instruction: ", dataList);
                        break;
                }
            }
        }

    });
});

exports.start = () => {
    return new Promise((resolve, reject) => {
        server.on('close', () => {
            reject(new Error("Server Terminated"));
        });

        server.on('error', (err) => {
            reject(err);
        });

        server.listen(0, () => {
            config.setServicePort(server.address().port);
            resolve();
        });
    });
}