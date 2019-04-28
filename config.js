let system = {
    // Constants // start with upper case
    ClientName: "TorChat3",
    ClientVersion: "0.1",

    HiddenServiceVersion: 2,

    BufferMaximum: 10000,

    ConnectionTimeOut: 1000 * 60 * 3, // minuites
    ConnectionRetryTime: 1000 * 30, // seconds
    ProxyTimeOut: 1000 * 60 * 3, // minuites

    proxyPort: null,
    ServiceInsidePort: 12009,

    FileBlockSize: 1024 * 8, // 8k byte
    FileBlockWindow: 16,
    FileBufferSize: 1024 * 1024 * 1, // 1m byte

    TempDir: './temp',
    ContactFile: './contact',
    SettingFile: './setting',

    ChatListSize: 5000,

    // Variables
    servicePort: 0,
}
exports.system = system;

let setting = {
    torrcExpand: "",

    useBridge: 0,
    bridge: "",

    userStatus: 1,
    profileName: "",
    profileInfo: "",

    blackList: true,
    whiteList: false,

    nigthMode: false,
}
exports.setting = setting;

/**
 * low db
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(system.SettingFile);
const settingDB = low(adapter);
settingDB.defaults(setting).write()

function saveSetting() { settingDB.set(setting).write() }
exports.saveSetting = saveSetting;
/** */