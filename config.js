// Constants // start with upper case
const ClientName = "TorChat3";
const ClientVersion = "0.1";

const BufferMaximum = 10000;

const ConnectionTimeOut = 1000 * 60 * 3; // minuites
const ProxyTimeOut = 1000 * 60 * 3; // minuites
const ConnectionRetryTime = 1000 * 30 // seconds

const ServiceInsidePort = 12009;

const FileBlockSize = 1024 * 8; // 8k byte
const FileBlockWindow = 16;
const FileBufferSize = 1024 * 1024 * 1; // 1m byte

// Variables
let userStatus = 1

let torrcExpand = "";
let userBridge = 0;
let bridge = "";
let servicePort = 0;

let profileName = "";
let profileInfo = "";

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
    FileBlockSize, FileBlockWindow, FileBufferSize,

    // Variables
    torrcExpand, servicePort, userBridge, bridge,
    userStatus, profileName, profileInfo,
    chatListSize,
    blackList, whiteList
}