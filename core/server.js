const net = require('net');
const config = require('../config');
const constant = require('../constant');
const contact = require('./contact');
const protocol = require('./protocol');
const parser = require('./parser');

const torUtil = require('../tor/torUtils')

let server = net.createServer((client) => {
    let dataBuffer = "";
    let onStop = false;
    let arrivedPong;

    console.log('Client connection in');
    client.setTimeout(constant.ConnectionTimeOut);

    let publicKeyStr, publicKey, signedStr, signed,
        hostname, randomStrPong, targetUser, clientName, clientVersion;
    client.on('data', (data) => {
        if (onStop) {
            dataBuffer = "";
        }
        else {
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
                    dataBuffer = parsed.bufferAfter;

                    if (!protocol.validate(dataList)) { continue; }
                    switch (dataList[0]) {
                        case 'ping':
                            publicKeyStr = Buffer.from(dataList[1]);
                            publicKey = Buffer.from(publicKeyStr, 'base64');
                            randomStrPong = dataList[2];
                            signedStr = dataList[3];
                            signed = Buffer.from(signedStr, 'base64');

                            hostname = torUtil.generateHostname(publicKey);
                            if (torUtil.verify(publicKeyStr + randomStrPong, signed, publicKey)) {
                                targetUser = contact.addIncomingUser(hostname, randomStrPong);
                                if (targetUser) {
                                    client.removeAllListeners();
                                    targetUser.setSocketIn(client, dataBuffer);
                                    if (arrivedPong) {
                                        targetUser.validate(arrivedPong.randomStrPong);
                                        targetUser.clientName = arrivedPong.clientName;
                                        targetUser.clientVersion = arrivedPong.clientVersion;
                                    }
                                }
                            }

                            onStop = true;
                            break;

                        case 'pong':
                            randomStrPong = dataList[1];
                            clientName = dataList[2];
                            clientVersion = dataList[3];

                            arrivedPong = {
                                randomStrPong, clientName, clientVersion
                            }
                            console.log("pong arrived before ping");
                            break;

                        default:
                            console.log("Unknown instruction: ", dataList);
                            break;
                    }
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