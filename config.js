// Constants
const ClientName = "TorChat3";
const ClientVersion = "0.1";

const BufferMaximum = 10000;

const ConnectionTimeOut = 1000 * 60 * 5; // minuites
const ProxyTimeOut = 1000 * 60 * 5; // minuites
const ConnectionRetryTime = 1000 * 20 // seconds

const ServiceInsidePort = 12009;

const FileBlockSize = 1024 * 8; // 8k byte
const FileBufferSize = 1024 * 1024 * 1; // 1m byte

// Variables
let userStatus = 1

let torrcExpand = "";
let userBridge = false;
let bridge = "";
let servicePort = 0;

let profileName = "Tester 1";
let profileInfo = "this is test 1 \n haha";

let chatListSize = 100;

let ProxyOptions = {
    proxy: { host: '127.0.0.1', port: null, type: 5 },
    command: 'connect',
    destination: { host: "", port: ServiceInsidePort },
    timeout: ProxyTimeOut,
};

let blackList = true;
let whiteList = false;

//exports
module.exports = {
    // Constants
    ClientName, ClientVersion,
    BufferMaximum,
    ConnectionTimeOut, ProxyTimeOut, ConnectionRetryTime,
    ServiceInsidePort, ProxyOptions,
    FileBlockSize, FileBufferSize,

    // Variables
    torrcExpand, servicePort, userBridge, bridge,
    userStatus, profileName, profileInfo,
    chatListSize,
    blackList, whiteList
}