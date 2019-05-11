'use strict';

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

const constant = require(`${__base}/core/constant`);
const parser = require(`${__base}/core/network/parser`);
const langs = require(`${__base}/core/langs`);
const fs = require('fs');

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

exports.exportContact = (filePath) => {
    fs.copyFile(`${__base}/data/contact`, filePath, (err) => {
        console.log(err);
    });
}

exports.importContact = (filePath) => {
    if (fs.existsSync(filePath)) {
        const importAdapter = new FileSync(filePath);
        const importDB = low(importAdapter);

        const importFriendList = importDB.get('friend').value();
        importFriendList.forEach((friend) => {
            if (friendList.indexOf(friend) == -1) { friendList.push(friend); }
        });

        const importBlackList = importDB.get('black').value();
        importBlackList.forEach((black) => {
            if (blackList.indexOf(black) == -1) { blackList.push(black); }
        });

        const importWhiteList = importDB.get('white').value();
        importWhiteList.forEach((white) => {
            if (whiteList.indexOf(white) == -1) { whiteList.push(white); }
        });

        const importNicknameList = importDB.get('nickname').value();
        for (const key in importNicknameList) {
            if (importNicknameList[key].length && importNicknameList[key].length > 0) {
                nicknameList[key] = importNicknameList[key];
            }
        }

        saveContact();
    }
}

// ############################ friend List ############################ //
let friendList = contactDB.get('friend').value();
exports.getFriendList = () => { return friendList; }
exports.setFriendList = (newFriendList) => { friendList = newFriendList }
exports.isFriend = (hostname) => {
    hostname = parser.normalizeHostname(hostname);
    if (friendList.indexOf(hostname) === -1) { return false; }
    return true;
}
exports.addFriend = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error(langs.get('ErrorInvalidAddress'))); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error(langs.get('ErrorMyAddress'))); return; }
        if (friendList.indexOf(hostname) > -1) { reject(new Error(langs.get('ErrorAlreadyFriend'))); return; }

        friendList.push(hostname);
        eventEmitter.emit('contactUpdate')
        resolve();
    })
}
exports.removeFriend = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (friendList.indexOf(hostname) === -1) { reject(new Error(langs.get('ErrorNotFriend'))); return; }

        friendList.splice(friendList.indexOf(hostname), 1);
        nicknameList[hostname] = "";

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
    if (blackList.indexOf(hostname) === -1) { return false; }
    return true;
}
exports.isBlack = isBlack;
exports.addBlack = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error(langs.get('ErrorInvalidAddress'))); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error(langs.get('ErrorMyAddress'))); return; }
        if (blackList.indexOf(hostname) > -1) { reject(new Error(langs.get('ErrorAlreadyBlack'))); return; }

        blackList.push(hostname);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}
exports.removeBlack = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (blackList.indexOf(hostname) === -1) { reject(new Error(lagns.get('ErrorNotBlack'))); return; }

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
    if (whiteList.indexOf(hostname) === -1) { return false; }
    return true;
}
exports.isWhite = isWhite;
exports.addWhite = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (!parser.checkHostname(hostname)) { reject(new Error(langs.get('ErrorInvalidAddress'))); return; }
        if (parser.isMyHostname(hostname)) { reject(new Error(langs.get('ErrorMyAddress'))); return; }
        if (whiteList.indexOf(hostname) > -1) { reject(new Error(langs.get('ErrorAlreadyWhite'))); return; }

        whiteList.push(hostname);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}
exports.removeWhite = (address) => {
    return new Promise((resolve, reject) => {
        const hostname = parser.normalizeHostname(address);
        if (whiteList.indexOf(hostname) === -1) { reject(new Error(lagns.get('ErrorNotWhite'))); return; }

        whiteList.splice(whiteList.indexOf(hostname), 1);
        eventEmitter.emit('contactUpdate');
        resolve();
    })
}