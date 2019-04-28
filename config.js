let config = {
    // Constants // start with upper case
    ClientName: "TorChat3",
    ClientVersion: "0.1",

    BufferMaximum: 10000,

    ConnectionTimeOut: 1000 * 60 * 3, // minuites
    ConnectionRetryTime: 1000 * 30, // seconds

    ServiceInsidePort: 12009,
    ProxyOptions: {
        proxy: { host: '127.0.0.1', port: null, type: 5 },
        command: 'connect',
        destination: { host: "", port: 12009 },
        timeout: 1000 * 60 * 3, // minuites
    },

    FileBlockSize: 1024 * 8, // 8k byte
    FileBlockWindow: 16,
    FileBufferSize: 1024 * 1024 * 1, // 1m byte

    TempDir: './temp',
    ContactFile: './contact',
    SettingFile: './setting',

    // Variables
    torrcExpand: "",
    servicePort: 0,
    useBridge: 0,
    bridge: "",

    userStatus: 1,
    profileName: "",
    profileInfo: "",

    chatListSize: 1000,

    blackList: true,
    whiteList: false,

    nigthMode: false,
}
exports.config = config;

/**
 * low db
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(config.SettingFile);
const settingDB = low(adapter);
settingDB.defaults({
    torrcExpand: config.torrcExpand,

    useBridge: config.useBridge,
    bridge: config.bridge,

    profileName: config.profileName,
    profileInfo: config.profileInfo,

    nigthMode: config.nigthMode,
})
    .write()


function saveSetting() {
    settingDB.set({
        torrcExpand: config.torrcExpand,

        useBridge: config.useBridge,
        bridge: config.bridge,

        profileName: config.profileName,
        profileInfo: config.profileInfo,

        nigthMode: config.nigthMode,
    })
        .write()
}
exports.saveSetting = saveSetting;
/** */