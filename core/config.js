'use strict';

const constant = require(`${__base}/core/constant`);

let servicePort = 0;
exports.getServicePort = () => { return servicePort; }
exports.setServicePort = (newPort) => { servicePort = newPort; }

let proxyPort = 0;
exports.getProxyPort = () => { return proxyPort; }
exports.setProxyPort = (newPort) => { proxyPort = newPort; }

exports.getProxyOptions = (hostname) => {
    return {
        proxy: { host: '127.0.0.1', port: proxyPort, type: 5 },
        command: 'connect',
        destination: { host: hostname + ".onion", port: 12009 },
        timeout: constant.ProxyTimeOut
    };
}

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
const adapter = new FileSync(`${__base}/data/setting`);
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

        nightMode: false,
        language: "English",

        minimizeToTray: true,
        notification: true,
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

exports.setNightMode = (data) => { setting.nightMode = data; eventEmitter.emit('settingUpdate'); }
exports.setLanguage = (lang) => { setting.language = lang; eventEmitter.emit('settingUpdate'); }

exports.setMinimizeToTray = (data) => { setting.minimizeToTray = data; eventEmitter.emit('settingUpdate'); }
exports.setNotification = (data) => { setting.notification = data; eventEmitter.emit('settingUpdate'); }