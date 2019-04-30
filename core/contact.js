const config = require('../config');
const User = require('./User');
const EventEmitter = require('events');

function normalizeHostname(hostname) {
    hostname = hostname.toLowerCase();
    if (hostname.indexOf('tc3:') == 0) { return hostname.substr('tc3:'.length); }
    return hostname;
}
exports.normalizeHostname = normalizeHostname;

function checkHostname(hostname) {
    let valid = true;
    hostname = normalizeHostname(hostname);
    if (config.system.HiddenServiceVersion == 3) {
        if (hostname.length != 56) { return false; }
    }
    else if (config.system.HiddenServiceVersion == 2) {
        if (hostname.length != 16) { return false; }
    }
    hostname.split('').forEach(char => {
        if (!char.match(/[0-9]|[a-z]/)) { valid = false; }
    });
    return valid;
}
exports.checkHostname = checkHostname;

// ############################ user List ############################ //
let userList = [];
setInterval(removeDestroyedUser, 1000 * 1); // seconds

exports.getUserListRaw = () => {
    return userList;
}

let eventEmitter = new EventEmitter();
exports.event = eventEmitter;
/**
 * newUser [hostname]
 * contactUpdate
 */

let eventEmitterUser = new EventEmitter();
exports.eventUser = eventEmitterUser;
/**
 * userHalfConnect [hostname]
 * userConnect [hostname]
 * userDisconnect [hostname]
 * userStatus [hostname] [status]
 * userProfile [hostname] [name] [info]
 * userClient [hostname] [name] [version]
 * userMessage [hostname] [message] [options]
 * userFileAccept [hostname] [fileID]
 * userFileFinished [hostname] [fileID]
 * userFileError [hostname] [fileID]
 * userFileCancel [hostname] [fileID]
 * userFileData [hostname] [fileID] [accumSize]
 * userFileSpeed [hostname] [fileID] [speed]
 */

function findUser(hostname) {
    let targetUser;
    userList.forEach(user => {
        if (user.hostname == hostname) {
            targetUser = user;
        }
    });
    return targetUser;
}
exports.findUser = findUser;

function addUser(hostname) {
    let targetUser = findUser(hostname);
    if (targetUser) { return targetUser; } // already exists

    targetUser = new User(hostname);
    userList.push(targetUser);

    eventEmitter.emit('newUser', hostname);
    targetUser.on('halfconnect', () => { eventEmitterUser.emit('userHalfConnect', hostname); })
    targetUser.on('connect', () => { eventEmitterUser.emit('userConnect', hostname); })
    targetUser.on('disconnect', () => { eventEmitterUser.emit('userDisconnect', hostname); })
    targetUser.on('status', (status) => { eventEmitterUser.emit('userStatus', hostname, status); })
    targetUser.on('profile', (name, info) => { eventEmitterUser.emit('userProfile', hostname, name, info); })
    targetUser.on('client', (name, version) => { eventEmitterUser.emit('userClient', hostname, name, version); })
    targetUser.on('message', (message, options) => { eventEmitterUser.emit('userMessage', hostname, message, options); })

    targetUser.on('fileaccept', (fileID) => { eventEmitterUser.emit('userFileAccept', hostname, fileID); })
    targetUser.on('filefinished', (fileID) => { eventEmitterUser.emit('userFileFinished', hostname, fileID); })
    targetUser.on('fileerror', (fileID) => { eventEmitterUser.emit('userFileError', hostname, fileID); })
    targetUser.on('filecancel', (fileID) => { eventEmitterUser.emit('userFileCancel', hostname, fileID); })
    targetUser.on('filedata', (fileID, accumSize) => { eventEmitterUser.emit('userFileData', hostname, fileID, accumSize); })
    targetUser.on('filespeed', (fileID, speed) => { eventEmitterUser.emit('userFileSpeed', hostname, fileID, speed); })

    return targetUser;
}
exports.addUser = addUser;

function removeUser(hostname) {
    let targetUser = findUser(hostname);
    if (targetUser) {
        targetUser.destroy();
        removeDestroyedUser();
    }
}

function addUserFromFriendList() {
    friendList.forEach(address => {
        if (config.getSetting().blackList && isBlack(address)) { return; }
        if (!config.getSetting().whiteList || (config.getSetting().whiteList && isWhite(address))) {
            let hostname = normalizeHostname(address);
            if (!checkHostname(hostname)) { return; }
            addUser(hostname);
        }
    });
}
exports.addUserFromFriendList = addUserFromFriendList;

function addIncomingUser(hostname, randomStrPong) {
    hostname = normalizeHostname(hostname);
    if (!checkHostname(hostname)) { return; }

    if (config.getSetting().blackList && isBlack(hostname)) { return; }
    if (!config.getSetting().whiteList || (config.getSetting().whiteList && isWhite(hostname))) {
        let targetUser = addUser(hostname);

        targetUser.hasIncome(randomStrPong);

        return targetUser;
    }
}
exports.addIncomingUser = addIncomingUser;

function removeDestroyedUser() {
    userList = userList.filter((user) => {
        if (user.destroyed) {
            return false;
        }
        return true;
    });
}

/**
 * low db
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(config.system.ContactFile);
const contactDB = low(adapter);
contactDB.defaults({ friend: [], nickname: {}, black: [], white: [] })
    .write()

function saveContact() {
    contactDB.set('friend', friendList).write();
    contactDB.set('nickname', nicknameList).write();
    contactDB.set('black', blackList).write();
    contactDB.set('white', whiteList).write();
}
exports.saveContact = saveContact;
/** */

// ############################ friend List ############################ //
let friendList = contactDB.get('friend').value();
exports.getFriendList = () => { return friendList; }
exports.setFriendList = (newFriendList) => { friendList = newFriendList }
exports.isFriend = (hostname) => {
    hostname = normalizeHostname(hostname);
    if (friendList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.addFriend = (address) => {
    const hostname = normalizeHostname(address);
    if (!checkHostname(hostname)) { return; }
    if (friendList.indexOf(hostname) > -1) { return; }

    friendList.push(hostname);
    eventEmitter.emit('contactUpdate')
}
exports.removeFriend = (address) => {
    const hostname = normalizeHostname(address);
    if (friendList.indexOf(hostname) == -1) { return; }

    friendList.splice(friendList.indexOf(hostname), 1);
    eventEmitter.emit('contactUpdate')
}

// ############################ nickname List ############################ //
//test
let nicknameList = contactDB.get('nickname').value();
exports.getNickname = (address) => {
    const hostname = normalizeHostname(address);
    if (!checkHostname(hostname)) { return ""; }

    if (nicknameList[hostname] && nicknameList[hostname].length > 0) {
        return nicknameList[hostname];
    }
    return "";
}
exports.setNickname = (address, nickname) => {
    const hostname = normalizeHostname(address);
    if (!checkHostname(hostname)) { return; }
    if (nickname.length <= 0) { return; }

    nicknameList[hostname] = nickname;
    eventEmitter.emit('contactUpdate');
}

// ############################ Black List ############################ //
let blackList = contactDB.get('black').value();
exports.getBlackList = () => { return blackList; }
exports.setBlackList = (newBlackList) => { blackList = newBlackList }
function isBlack(hostname) {
    hostname = normalizeHostname(hostname);
    if (blackList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.isBlack = isBlack;
exports.addBlack = (address) => {
    const hostname = normalizeHostname(address);
    if (!checkHostname(hostname)) { return; }
    if (blackList.indexOf(hostname) > -1) { return; }

    blackList.push(hostname);
    eventEmitter.emit('contactUpdate');
}
exports.removeBlack = (address) => {
    const hostname = normalizeHostname(address);
    if (blackList.indexOf(hostname) == -1) { return; }

    blackList.splice(blackList.indexOf(hostname), 1);
    eventEmitter.emit('contactUpdate');
}

// ############################ White List ############################ //
let whiteList = contactDB.get('white').value();
exports.getWhiteList = () => { return whiteList; }
exports.setWhiteList = (newWhiteList) => { whiteList = newWhiteList }
function isWhite(hostname) {
    hostname = normalizeHostname(hostname);
    if (whiteList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.isWhite = isWhite;
exports.addWhite = (address) => {
    const hostname = normalizeHostname(address);
    if (!checkHostname(hostname)) { return; }
    if (whiteList.indexOf(hostname) > -1) { return; }

    whiteList.push(hostname);
    eventEmitter.emit('contactUpdate');
}
exports.removeWhite = (address) => {
    const hostname = normalizeHostname(address);
    if (whiteList.indexOf(hostname) == -1) { return; }

    whiteList.splice(whiteList.indexOf(hostname), 1);
    eventEmitter.emit('contactUpdate');
}