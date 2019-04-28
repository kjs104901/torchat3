const net = require('net');
const config = require('../config');
const tor = require('../tor/tor');
const contact = require('./contact');
const protocol = require('./protocol');
const parser = require('./parser');

let server = net.createServer((client) => {
    let dataBuffer = "";
    let onStop = false;
    let arrivedPong;

    console.log('Client connection in');
    client.setTimeout(config.system.ConnectionTimeOut);

    let hostname, randomStrPong, targetUser, clientName, clientVersion;
    client.on('data', (data) => {
        if (onStop) {
            dataBuffer = "";
        }
        else {
            dataBuffer += data.toString();
            if (dataBuffer.length > config.system.BufferMaximum) {
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
                            hostname = dataList[1];
                            randomStrPong = dataList[2];

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
            config.system.servicePort = server.address().port;
            resolve();
        });
    });
}