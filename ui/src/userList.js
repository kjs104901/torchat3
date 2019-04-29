const { ipcRenderer } = require('electron');

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
    //TODO need to compare properly

    const vA = userA.lastMessageDate;
    const vB = userB.lastMessageDate;
    return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
}

exports.addUser = (address) => {
    let targetUser = findUser(address);
    if (!targetUser) {
        targetUser = new User(address)
        userList.push(targetUser);

        eventEmitter.emit('updateUI');
        return targetUser;
    }
}

exports.connect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.connected != true) {
            targetUser.connected = true;
            eventEmitter.emit('updateUI');
        }
        return targetUser;
    }
}

exports.disconnect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.connected != false) {
            targetUser.connected = false;
            eventEmitter.emit('updateUI');
        }
        return targetUser;
    }
}

exports.alive = (address, status) => {
    const targetUser = findUser(address);
    if (targetUser) {
        if (targetUser.status != status) {
            targetUser.status = status;
            eventEmitter.emit('updateUI');
        }
        return targetUser;
    }
}

exports.profile = (address, name, info) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.profile.name = name;
        targetUser.profile.info = info;

        eventEmitter.emit('updateUI');
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

        eventEmitter.emit('updateUI');
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

/**
 * contact update
 */
let friendList = [];
let blackList = [];
let whiteList = [];

exports.contactUpdate = (newFriendList, newBlackList, newWhiteList) => {
    friendList = newFriendList;
    blackList = newBlackList;
    whiteList = newWhiteList;
    eventEmitter.emit('updateUI');
}

function saveContact() {
    //test
    console.log("friendList", friendList, blackList, whiteList);

    ipcRenderer.send('saveContact', { friendList, blackList, whiteList });
}
exports.saveContact = saveContact;

exports.getFriendList = () => { return friendList };
exports.isFriend = (address) => {
    if (friendList.indexOf(address) > -1) { return true; }
    return false;
}
exports.addFriend = (targetAddress) => {
    if (friendList.indexOf(targetAddress) == -1) {
        friendList.push(targetAddress);

        //test
        console.log("friendList", friendList);

        saveContact()
    }
}
exports.removeFriend = (targetAddress) => {
    let changed = false;
    friendList = friendList.filter((friend) => {
        if (friend == targetAddress) { changed = true; return false; }
        return true;
    })
    if (changed) {
        saveContact();
    }
}

exports.getBlackList = () => { return blackList; };
exports.isBlack = (address) => {
    if (blackList.indexOf(address) > -1) { return true; }
    return false;
}
exports.addBlack = (targetAddress) => {
    if (blackList.indexOf(targetAddress) == -1) {
        blackList.push(targetAddress);
        saveContact();
    }
}
exports.removeBlack = (targetAddress) => {
    let changed = false;
    blackList = blackList.filter((black) => {
        if (black == targetAddress) { changed = true; return false; }
        return true;
    })
    if (changed) {
        saveContact();
    }
}

exports.getWhiteList = () => { return whiteList; };
exports.isWhite = (address) => {
    if (whiteList.indexOf(address) > -1) { return true; }
    return false;
}
exports.addWhite = (targetAddress) => {
    if (whiteList.indexOf(targetAddress) == -1) {
        whiteList.push(targetAddress);
        saveContact();
    }
}
exports.removeWhite = (targetAddress) => {
    let changed = false;
    whiteList = whiteList.filter((white) => {
        if (white == targetAddress) { changed = true; return false; }
        return true;
    })
    if (changed) {
        saveContact();
    }
}

