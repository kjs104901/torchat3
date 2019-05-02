const EventEmitter = require('events');

const config = require('../config');
const User = require('./User');
const parser = require('./parser');
const contact = require('./contact');

// ############################ user List ############################ //
let userList = [];
setInterval(removeDestroyedUser, 1000 * 1); // seconds

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
    targetUser.on('destroy', () => { eventEmitterUser.emit('userDestroy', hostname); })
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
    const friendList = contact.getFriendList();
    friendList.forEach(address => {
        if (config.getSetting().blackList && contact.isBlack(address)) { return; }
        if (!config.getSetting().whiteList || (config.getSetting().whiteList && contact.isWhite(address))) {
            let hostname = parser.normalizeHostname(address);
            if (!parser.checkHostname(hostname)) { return; }
            addUser(hostname);
        }
    });
}
exports.addUserFromFriendList = addUserFromFriendList;

function addIncomingUser(hostname, randomStrPong) {
    hostname = parser.normalizeHostname(hostname);
    if (!parser.checkHostname(hostname)) { return; }

    if (config.getSetting().blackList && contact.isBlack(hostname)) { return; }
    if (!config.getSetting().whiteList || (config.getSetting().whiteList && contact.isWhite(hostname))) {
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