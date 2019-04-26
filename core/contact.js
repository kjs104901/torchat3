const config = require('../config');
const User = require('./User');
const EventEmitter = require('events');

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
            cancleFile: user.fileCancle, // cancleFile(fileID)
        };
    });
}

exports.getUserListData = () => {
    return userList.map((user) => {
        return {
            address: user.hostname,
            connected: user.isValid(),
            status: user.status,
            profile: {
                name: user.profileName,
                info: user.profileInfo
            },
            client: {
                name: user.clientName,
                version: user.clientVersion,
            }
        };
    });
}

let eventEmitter = new EventEmitter();
exports.event = eventEmitter; /*
    userListUpdate
    friendListUpdate
    blackListUpdate
    writeListUpdate
*/

let eventEmitterUser = new EventEmitter();
exports.eventUser = eventEmitterUser; /*
    userConnect [hostname]
    userClose   [hostname]
    userAlive [hostname] [status]
    userProfile [hostname]
    userMessage [hostname] [message] [options]
    userFileaccept [hostname] [fileID]
    userFileupdate [hostname] [fileID]
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

function addUser(hostname) {
    let targetUser = findUser(hostname);
    if (targetUser) { return targetUser; } // already exists

    targetUser = new User(hostname);
    userList.push(targetUser);

    eventEmitter.emit('userListUpdate');
    targetUser.on('connect', () => { eventEmitterUser.emit('userConnect', hostname); })
    targetUser.on('close', () => { eventEmitterUser.emit('userClose', hostname); })
    targetUser.on('alive', (status) => { eventEmitterUser.emit('userAlive', hostname, status); })
    targetUser.on('profile', () => { eventEmitterUser.emit('userProfile', hostname); })
    targetUser.on('message', (message, options) => { eventEmitterUser.emit('userMessage', hostname, message, options); })
    targetUser.on('fileaccept', (fileID) => { eventEmitterUser.emit('userFileaccept', hostname, fileID); })
    targetUser.on('fileupdate', (fileID) => { eventEmitterUser.emit('userFileupdate', hostname, fileID); })

    return targetUser;
}

function removeUser(hostname) {
    let targetUser = findUser(hostname);
    if (targetUser) {
        targetUser.destroy();
        removeDestroyedUser();
    }
}
exports.removeUser = removeUser;

function addIncomingUser(hostname, randomStrPong) {
    if (config.blackList && isBlack(hostname)) {
        return;
    }

    if (!config.whiteList || (config.whiteList && isWhite(hostname))) {
        let targetUser = addUser(hostname);

        targetUser.hasIncome(randomStrPong);

        return targetUser;
    }
}
exports.addIncomingUser = addIncomingUser;

function removeDestroyedUser() {
    let updated = false;
    userList = userList.filter((user) => {
        if (user.destroyed) {
            updated = true;
            return false;
        }
        return true;
    });

    if (updated) {
        eventEmitter.emit('userListUpdate');
    }
}

// ############################ friend List ############################ //
let friendList = [];
exports.getFriendList = () => {
    return friendList;
}

exports.isFriend = (hostname) => {
    if (friendList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}

exports.addFriend = (hostname) => {
    if (friendList.indexOf(hostname) == -1) {
        friendList.push(hostname);
        eventEmitter.emit('friendListUpdate');
        addUser(hostname);
    }
}

exports.removeFriend = (hostname) => {
    if (friendList.indexOf(hostname) > -1) {
        friendList.splice(friendList.indexOf(hostname), 1);
        eventEmitter.emit('friendListUpdate');
    }
}

// ############################ Black List ############################ //
let blackList = [];
exports.getBlackList = () => {
    return blackList;
}

function isBlack(hostname) {
    if (blackList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}
exports.isBlack = isBlack;

exports.addBlack = (hostname) => {
    if (blackList.indexOf(hostname) == -1) {
        blackList.push(hostname);
        eventEmitter.emit('blackListUpdate');
    }
}

exports.removeBlack = (hostname) => {
    if (blackList.indexOf(hostname) > -1) {
        blackList.splice(blackList.indexOf(hostname), 1);
        eventEmitter.emit('blackListUpdate');
    }
}

// ############################ White List ############################ //
let whiteList = [];
exports.getWhiteList = () => {
    return whiteList;
}

function isWhite(hostname) {
    if (whiteList.indexOf(hostname) == -1) {
        return false;
    }
    return true;
}
exports.isWhite = isWhite;

exports.addWhite = (hostname) => {
    if (whiteList.indexOf(hostname) == -1) {
        whiteList.push(hostname);
        eventEmitter.emit('whiteListUpdate');
    }
}

exports.removeWhite = (hostname) => {
    if (whiteList.indexOf(hostname) > -1) {
        whiteList.splice(whiteList.indexOf(hostname), 1);
        eventEmitter.emit('whiteListUpdate');
    }
}