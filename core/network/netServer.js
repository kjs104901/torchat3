const net = require('net');

const config = require(`${__base}/core/config`);
const constant = require(`${__base}/core/constant`);

const contact = require(`${__base}/core/contact`);
const netUserList = require(`${__base}/core/netUserList`);
const protocol = require(`${__base}/core/network/protocol`);
const parser = require(`${__base}/core/network/parser`);
const debug = require(`${__base}/core/debug`);

const torUtil = require(`${__base}/tor/torUtils`)

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