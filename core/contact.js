'use strict';

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

const constant = require(`${__base}/core/constant`);
const parser = require(`${__base}/core/network/parser`);

/**
 * low db
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(`${__base}/data/contact`);
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
    hostname = parser.normalizeHostname(hostname);
    if (friendList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.addFriend = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error('invalid hostname')); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error('my hostname')); return; }
        if (friendList.indexOf(hostname) > -1) { reject(new Error('already friend')); return; }

        friendList.push(hostname);
        eventEmitter.emit('contactUpdate')
        resolve();
    })
}
exports.removeFriend = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (friendList.indexOf(hostname) == -1) { reject(new Error('not friend')); return; }

        friendList.splice(friendList.indexOf(hostname), 1);
        eventEmitter.emit('contactUpdate')
        resolve();
    })
}

// ############################ nickname List ############################ //
let nicknameList = contactDB.get('nickname').value();
exports.getNickname = (address) => {
    const hostname = parser.normalizeHostname(address);
    if (!parser.checkHostname(hostname)) { return ""; }

    if (nicknameList[hostname] && nicknameList[hostname].length > 0) {
        return nicknameList[hostname];
    }
    return "";
}
exports.setNickname = (address, nickname) => {
    const hostname = parser.normalizeHostname(address);
    if (!parser.checkHostname(hostname)) { return; }

    nicknameList[hostname] = nickname;
    eventEmitter.emit('contactUpdate');
}

// ############################ Black List ############################ //
let blackList = contactDB.get('black').value();
exports.getBlackList = () => { return blackList; }
exports.setBlackList = (newBlackList) => { blackList = newBlackList }
function isBlack(hostname) {
    hostname = parser.normalizeHostname(hostname);
    if (blackList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.isBlack = isBlack;
exports.addBlack = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error('invalid hostname')); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error('my hostname')); return; }
        if (blackList.indexOf(hostname) > -1) { reject(new Error('already black')); return; }

        blackList.push(hostname);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}
exports.removeBlack = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (blackList.indexOf(hostname) == -1) { reject(new Error('not black')); return; }

        blackList.splice(blackList.indexOf(hostname), 1);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}

// ############################ White List ############################ //
let whiteList = contactDB.get('white').value();
exports.getWhiteList = () => { return whiteList; }
exports.setWhiteList = (newWhiteList) => { whiteList = newWhiteList }
function isWhite(hostname) {
    hostname = parser.normalizeHostname(hostname);
    if (whiteList.indexOf(hostname) == -1) { return false; }
    return true;
}
exports.isWhite = isWhite;
exports.addWhite = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error('invalid hostname')); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error('my hostname')); return; }
        if (whiteList.indexOf(hostname) > -1) { reject(new Error('already white')); return; }

        whiteList.push(hostname);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}
exports.removeWhite = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (whiteList.indexOf(hostname) == -1) { reject(new Error('not white')); return; }

        whiteList.splice(whiteList.indexOf(hostname), 1);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}