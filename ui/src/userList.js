const { remote } = require('electron');
const contact = remote.require('./core/contact');

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

let userList = [];

class User {
    constructor(address) {
        this.address = address;
        this.connected = false;
        this.status = 0;
        this.profile = { name: "", info: "" };
        this.client = { name: "", version: "" }

        this.messageList = [];
        this.lastMessageDate = new Date();
    }
}
exports.getList = () => { return userList; }
exports.setList = (newList) => { userList = newList; }

function findUser(address) {
    let targetUser;
    userList.forEach(user => {
        if (user.address == address) {
            targetUser = user;
        }
    });
    return targetUser;
}
exports.findUser = findUser;

exports.compareUser = (userA, userB) => {
    if (userA.connected && !userB.connected) { return -1; }
    else if (!userA.connected && userB.connected) { return 1; }
    else if (userA.connected && userB.connected) {
        if (userA.lastMessageDate > userB.lastMessageDate) { return -1; }
        else if (userA.lastMessageDate < userB.lastMessageDate) { return 1; }
        else { return 0; }
    }
    else if (!userA.connected && !userB.connected) {
        if (!contact.isBlack(userA.address) && contact.isBlack(userB.address)) { return -1; }
        else if (contact.isBlack(userA.address) && !contact.isBlack(userB.address)) { return 1; }
        else if (contact.isFriend(userA.address) && !contact.isFriend(userB.address)) { return -1; }
        else if (!contact.isFriend(userA.address) && contact.isFriend(userB.address)) { return 1; }
        else { return 0; }
    }
}

exports.addUser = (address) => {
    let targetUser = findUser(address);
    if (!targetUser) {
        targetUser = new User(address)
        userList.push(targetUser);

        eventEmitter.emit('updated');
        return targetUser;
    }
}

exports.connect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.connected != true) {
            targetUser.connected = true;
            eventEmitter.emit('updated');
        }
        return targetUser;
    }
}

exports.disconnect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.connected != false) {
            targetUser.connected = false;
            eventEmitter.emit('updated');
        }
        return targetUser;
    }
}

exports.status = (address, status) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.status != status) {
            targetUser.status = status;
            eventEmitter.emit('updated');
        }
        return targetUser;
    }
}

exports.profile = (address, name, info) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.profile.name = name;
        targetUser.profile.info = info;

        eventEmitter.emit('updated');
        return targetUser;
    }
}

exports.client = (address, name, version) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.client.name = name;
        targetUser.client.info = version;
        return targetUser;
    }
}

exports.message = (address, message, options) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (options.fileID) { // file message
            //options.fileID = "";
            //options.fileSize = 0;
            options.accepted = false;
            options.finished = false;
            options.error = false;
            options.canceled = false;
            options.accumSize = 0;
            options.speed = 0;
        }

        targetUser.messageList.push({ message, options });
        targetUser.lastMessageDate = new Date();

        eventEmitter.emit('updated');
        return targetUser;
    }
}

function findMessage(address, fileID) {
    const targetUser = findUser(address);
    if (targetUser) {
        let targetMessage;
        targetUser.messageList.forEach(message => {
            if (message.options.fileID == fileID) {
                targetMessage = message;
            }
        });
        return targetMessage;
    }
}

exports.fileAccept = (address, fileID) => {
    //test
    console.log("accepted", address, fileID);
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.accepted = true;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}

exports.fileFinished = (address, fileID) => {
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.finished = true;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}

exports.fileError = (address, fileID) => {
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.error = true;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}
exports.fileCancel = (address, fileID) => {
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.canceled = true;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}

exports.fileData = (address, fileID, accumSize) => {
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.accumSize = accumSize;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}

exports.fileSpeed = (address, fileID, speed) => {
    const targetMessage = findMessage(address, fileID)
    if (targetMessage) {
        targetMessage.options.speed = speed;

        eventEmitter.emit('updateFile', address);
        return targetMessage;
    }
}
