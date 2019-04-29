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
}
exports.system = system;

servicePort = 0;
exports.getServicePort = () => { return system.servicePort; }
exports.setServicePort = (newPort) => { system.servicePort = newPort; }

/**
 * Emitter
 */
const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;
/**
 * low db
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(system.SettingFile);
const settingDB = low(adapter);
settingDB.defaults({
    setting: {}
}).write();

settingDB.get('setting')
    .defaults({
        torrcExpand: "",

        useBridge: false,
        bridge: "",

        userStatus: 1,
        profileName: "",
        profileInfo: "",

        blackList: true,
        whiteList: false,

        nigthMode: false,
    }).write();

let setting = settingDB.get('setting').value();

exports.getSetting = () => { return setting; }
exports.saveSetting = () => { settingDB.set('setting', setting).write() };

exports.setTorrcExpand = (data) => { setting.torrcExpand = data; eventEmitter.emit('settingUpdate'); }

exports.setUseBridge = (data) => { setting.useBridge = data; eventEmitter.emit('settingUpdate'); }
exports.setBridge = (data) => { setting.bridge = data; eventEmitter.emit('settingUpdate'); }

exports.setUserStatus = (data) => { setting.userStatus = data; eventEmitter.emit('settingUpdate'); }

exports.setProfileName = (data) => { setting.profileName = data; eventEmitter.emit('settingUpdate'); }
exports.setProfileInfo = (data) => { setting.profileInfo = data; eventEmitter.emit('settingUpdate'); }

exports.setBlackList = (data) => { setting.blackList = data; eventEmitter.emit('settingUpdate'); }
exports.setWhiteList = (data) => { setting.whiteList = data; eventEmitter.emit('settingUpdate'); }

exports.setNigthMode = (data) => { setting.nigthMode = data; eventEmitter.emit('settingUpdate'); }