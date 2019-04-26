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
            hostname: user.hostname,
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

            on: this.eventEmitter.on /*
                connect
                close
                alive
                profile
                message / message, options
                fileaccept / fileID
                fileupdate / fileID
            */
        };
    });
}

let eventEmitter = new EventEmitter();
exports.on = eventEmitter.on; /*
    userListUpdate
    friendListUpdate
    blackListUpdate
    writeListUpdate
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