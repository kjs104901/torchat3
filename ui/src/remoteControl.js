const { remote } = require('electron');
const { BrowserWindow, dialog } = remote;

const contact = remote.require('./core/contact');
const config = remote.require('./config');
const tor = remote.require('./tor/tor')

const userList = require('./userList');

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

// tor
exports.getProgress = () => { return tor.getProgress(); }
exports.getBootLogs = () => { return tor.getBootLogs(); }
exports.getSuccess = () => { return tor.getSuccess(); }
exports.getFail = () => { return tor.getFail(); }

// contact
exports.isFriend = (address) => { return contact.isFriend(address); }
exports.addFriend = (address) => {
    contact.addFriend(address);
    contact.addUserFromFriendList();
    contact.saveContact();
}
exports.removeFriend = (address) => {
    contact.removeFriend(address);
    contact.saveContact();
}

exports.isBlack = (address) => { return contact.isBlack(address); }
exports.addBlack = (address) => {
    contact.addBlack(address);
    contact.saveContact();
}

exports.removeBlack = (address) => {
    contact.removeBlack(address);
    contact.saveContact();
}

// config
exports.getSetting = () => {
    return config.getSetting();
}

exports.saveProfile = (name, info) => {
    config.setProfileName(name);
    config.setProfileInfo(info);
    config.saveSetting();
}

exports.saveConnection = (torrcExpand, bridge) => {
    config.setTorrcExpand(torrcExpand);
    config.setBridge(bridge);
    config.saveSetting();
}

exports.switchNightMode = () => {
    config.setNigthMode(!config.getSetting().nigthMode);
    config.saveSetting();
}

exports.setLanguage = (lang) => {
    config.setLanguage(lang);
    config.saveSetting();
}

// Chatting
exports.sendMessage = (address, message) => {
    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.sendMessage(message)
            .catch((err) => { console.log(err); })
    }
}

exports.sendFileDialog = (address) => {
    const targetWindow = BrowserWindow.getFocusedWindow();
    if (targetWindow) {
        dialog.showOpenDialog(targetWindow, { properties: ['openFile'] }, (files) => {
            if (files && files[0] && files[0].length > 0) {
                const file = files[0];
                const targetUser = contact.findUser(address);
                if (targetUser) {
                    targetUser.sendFileSend(file)
                        .catch((err) => { console.log(err); })
                }
            }
        });
    }
}
exports.sendFile = (address, file) => {
    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.sendFileSend(file)
            .catch((err) => { console.log(err); })
    }
}

exports.acceptFile = (address, fileID) => {
    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.sendFileAccept(fileID)
            .catch((err) => { console.log(err); })
    }
}

exports.cancelFile = (address, fileID) => {
    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.fileCancel(fileID);
    }
}

////////// event listner
// tor
tor.event.on('update', () => { eventEmitter.emit('torUpdate'); });
tor.event.on('success', () => { eventEmitter.emit('torSuccess'); });
tor.event.on('fail', () => { eventEmitter.emit('torFail'); });

// setting
config.event.on('settingUpdate', () => { eventEmitter.emit('settingUpdate'); });

// contact
contact.event.on('contactUpdate', () => { eventEmitter.emit('contactUpdate'); })

// user
contact.event.on('newUser', (address) => { userList.addUser(address); });

contact.eventUser.on('userConnect', (address) => { userList.connect(address); });
contact.eventUser.on('userDisconnect', (address) => { userList.disconnect(address); });
contact.eventUser.on('userStatus', (address, status) => { userList.status(address, status); });
contact.eventUser.on('userProfile', (address, name, info) => { userList.profile(address, name, info); });
contact.eventUser.on('userClient', (address, name, version) => { userList.client(address, name, version); });
contact.eventUser.on('userMessage', (address, message, options) => { userList.message(address, message, options); });

contact.eventUser.on('userFileAccept', (address, fileID) => { userList.fileAccept(address, fileID); });
contact.eventUser.on('userFileFinished', (address, fileID) => { userList.fileFinished(address, fileID); });
contact.eventUser.on('userFileError', (address, fileID) => { userList.fileError(address, fileID); });
contact.eventUser.on('userFileCancel', (address, fileID) => { userList.fileCancel(address, fileID); });
contact.eventUser.on('userFileData', (address, fileID, accumSize) => { userList.fileData(address, fileID, accumSize); });
contact.eventUser.on('userFileSpeed', (address, fileID, speed) => { userList.fileSpeed(address, fileID, speed); });