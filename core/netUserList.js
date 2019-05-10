"use strict";

const EventEmitter = require('events');

const config = require(`${__base}/core/config`);

const User = require(`${__base}/core/NetUser`);
const parser = require(`${__base}/core/network/parser`);
const contact = require(`${__base}/core/contact`);

const tor = require(`${__base}/tor/tor`);

// ############################ user List ############################ //
let userList = [];
setInterval(removeDestroyedUser, 1000 * 1); // seconds

let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

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

exports.getUserName = (address) => {
    let nickname = contact.getNickname(address);
    if (nickname.length == 0) {
        const targetUser = findUser(address);
        if (targetUser) { nickname = targetUser.profileName; }
    }
    if (nickname.length == 0) { nickname = "tc3:" + address; }
    return nickname;
}

function addUser(address) {
    const hostname = parser.normalizeHostname(address);
    if (!parser.checkHostname(hostname)) { return; } // hostname error

    let targetUser = findUser(hostname);
    if (targetUser) { return targetUser; } // already exists

    targetUser = new User(hostname);
    userList.push(targetUser);

    eventEmitter.emit('newUser', hostname);

    targetUser.on('socketOutConnected', () => { eventEmitter.emit('userSocketOutConnected', hostname); })
    targetUser.on('socketOutDisconnected', () => { eventEmitter.emit('userSocketOutDisconnected', hostname); })
    targetUser.on('socketInConnected', () => { eventEmitter.emit('userSocketInConnected', hostname); })
    targetUser.on('socketInDisconnected', () => { eventEmitter.emit('userSocketInDisconnected', hostname); })
    targetUser.on('socketBothConnected', () => { eventEmitter.emit('userSocketBothConnected', hostname); })

    targetUser.on('status', (status) => { eventEmitter.emit('userStatus', hostname, status); })
    targetUser.on('profile', (name, info) => { eventEmitter.emit('userProfile', hostname, name, info); })
    targetUser.on('client', (name, version) => { eventEmitter.emit('userClient', hostname, name, version); })
    targetUser.on('message', (message, options) => { eventEmitter.emit('userMessage', hostname, message, options); })

    targetUser.on('destroy', () => { eventEmitter.emit('userDestroy', hostname); })

    targetUser.on('fileaccept', (fileID) => { eventEmitter.emit('userFileAccept', hostname, fileID); })
    targetUser.on('filefinished', (fileID) => { eventEmitter.emit('userFileFinished', hostname, fileID); })
    targetUser.on('fileerror', (fileID) => { eventEmitter.emit('userFileError', hostname, fileID); })
    targetUser.on('filecancel', (fileID) => { eventEmitter.emit('userFileCancel', hostname, fileID); })
    targetUser.on('filedata', (fileID, accumSize) => { eventEmitter.emit('userFileData', hostname, fileID, accumSize); })
    targetUser.on('filespeed', (fileID, speed) => { eventEmitter.emit('userFileSpeed', hostname, fileID, speed); })

    return targetUser;
}
exports.addUser = addUser;

function destroyUser(hostname) {
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
            addUser(address);
        }
    });

    addUser(tor.getHostname());
}
exports.addUserFromFriendList = addUserFromFriendList;

function removeDestroyedUser() {
    userList = userList.filter((user) => {
        if (user.destroyed) {
            return false;
        }
        return true;
    });
}