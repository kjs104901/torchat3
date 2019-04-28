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
    if (hostname.length != 56) { return false; }
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

exports.getUserList = () => {
    return userList.map((user) => {
        return {
            address: user.hostname,
            isConnected: user.isValid, // isConnected()
            status: user.status,
            profile: {
                name: user.profileName,
                info: user.profileInfo
            },
            client: {
                name: user.clientName,
                version: user.clientVersion,
            },

            messages: user.messageList,
            lastMessageDate: user.lastMessageDate,
            sendMessage: user.sendMessage, // sendMessage(message) return Promise

            fileSendList: user.fileSendList,
            fileRecvList: user.fileRecvList,
            sendFile: user.sendFileSend, // sendFile(filename) return Promise
            acceptFile: user.sendFileAccept, // acceptFile(fileID) return Promise
            cancelFile: user.fileCancel, // cancelFile(fileID)
        };
    });
}

let eventEmitter = new EventEmitter();
exports.event = eventEmitter; /*
    newUser [hostname]
*/

let eventEmitterUser = new EventEmitter();
exports.eventUser = eventEmitterUser; /*
    userConnect [hostname]
    userDisconnect [hostname]
    userAlive [hostname] [status]
    userProfile [hostname] [name] [info]
    userClient [hostname] [name] [version]
    userMessage [hostname] [message] [options]

    userFileAccept [hostname] [fileID]
    userFileFinished [hostname] [fileID]
    userFileError [hostname] [fileID]
    userFileCancel [hostname] [fileID]
    userFileData [hostname] [fileID] [accumSize]
    userFileSpeed [hostname] [fileID] [speed]
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
    targetUser.on('connect', () => { eventEmitterUser.emit('userConnect', hostname); })
    targetUser.on('disconnect', () => { eventEmitterUser.emit('userDisconnect', hostname); })
    targetUser.on('alive', (status) => { eventEmitterUser.emit('userAlive', hostname, status); })
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

function removeUser(hostname) {
    let targetUser = findUser(hostname);
    if (targetUser) {
        targetUser.destroy();
        removeDestroyedUser();
    }
}

function addIncomingUser(hostname, randomStrPong) {
    hostname = normalizeHostname(hostname);
    if (!checkHostname(hostname)) { return; }

    if (config.blackList && isBlack(hostname)) { return; }
    if (!config.whiteList || (config.whiteList && isWhite(hostname))) {
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

// ############################ friend List ############################ //
let friendList = [];
exports.getFriendList = () => {
    return friendList;
}

exports.isFriend = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (friendList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}

exports.addFriend = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (checkHostname(hostname) && friendList.indexOf(hostname) == -1) {
        friendList.push(hostname);
        addUser(hostname);
        return true;
    }
    return false;
}

exports.removeFriend = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (friendList.indexOf(hostname) > -1) {
        friendList.splice(friendList.indexOf(hostname), 1);
    }
}

// ############################ Black List ############################ //
let blackList = [];
exports.getBlackList = () => {
    return blackList;
}

function isBlack(hostname) {
    hostname = normalizeHostname(hostname);

    if (blackList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}
exports.isBlack = isBlack;

exports.addBlack = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (checkHostname(hostname) && blackList.indexOf(hostname) == -1) {
        blackList.push(hostname);
        return true;
    }
    return false;
}

exports.removeBlack = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (blackList.indexOf(hostname) > -1) {
        blackList.splice(blackList.indexOf(hostname), 1);
    }
}

// ############################ White List ############################ //
let whiteList = [];
exports.getWhiteList = () => {
    return whiteList;
}

function isWhite(hostname) {
    hostname = normalizeHostname(hostname);

    if (whiteList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}
exports.isWhite = isWhite;

exports.addWhite = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (checkHostname(hostname) && whiteList.indexOf(hostname) == -1) {
        whiteList.push(hostname);
        eventEmitter.emit('whiteListUpdate');
        return true;
    }
    return false;
}

exports.removeWhite = (hostname) => {
    hostname = normalizeHostname(hostname);

    if (whiteList.indexOf(hostname) > -1) {
        whiteList.splice(whiteList.indexOf(hostname), 1);
        eventEmitter.emit('whiteListUpdate');
    }
}