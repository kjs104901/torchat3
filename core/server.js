const net = require('net');
const config = require('../config');
const tor = require('../tor/tor');
const contact = require('./contact');
const parser = require('./parser');

let server = net.createServer((client) => {
    let dataBuffer = "";
    let onStop = false;
    let hostname, randomStrPong, targetUser;

    console.log('Client connection in');
    client.setTimeout(config.ConnectionTimeOut);

    client.on('data', (data) => {
        if (onStop) {
            dataBuffer = "";
        }
        else {
            dataBuffer += data.toString();
            if (dataBuffer.length > config.BufferMaximum) {
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
        
                    switch (dataList[0]) {
                        case 'ping':
                            hostname = dataList[1];
                            randomStrPong = dataList[2];
        
                            targetUser = contact.addIncomingUser(hostname, randomStrPong);
                            if (targetUser) {
                                targetUser.setSocketIn(client, dataBuffer);
                            }
                            onStop = true;
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
            config.servicePort = server.address().port;
            resolve();
        });
    });
}