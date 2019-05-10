'use strict';

const notifier = require('node-notifier');

const contact = require(`${__base}/core/contact`);
const netUserList = require(`${__base}/core/netUserList`);
const fileHandler  = require(`${__base}/core/fileIO/fileHandler`)
const langs = require(`${__base}/core/langs`);

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

let newMessageList = [];
let newConnectionList = [];

exports.newMessage = (address, message) => {
    if (newMessageList.indexOf(address) === -1) {
        newMessageList.push(address);

        let nickname = netUserList.getUserName(address);

        notify(address, nickname, message)
    }
}

exports.newConnection = (address) => {
    if (newConnectionList.indexOf(address) === -1) {
        newConnectionList.push(address);

        let nickname = netUserList.getUserName(address);
        
        notify(address, langs.get('NotificationConnected'), nickname)
    }
}

exports.clearHistory = () => {
    newMessageList = [];
    newConnectionList = [];
}

function notify(address, title, message) {
    if (message.length > 50) { message = message.substr(0, 50) + "..."; }
    if (title.length > 30) { title = title.substr(0, 30) + "..."; }
    const icon = fileHandler.getProfileImagePath(address);

    notifier.notify({
        address, title, message, icon,
        sound: true,
        wait: true,
    });
}
exports.notify = notify;

notifier.on('click', function (notifierObject, options) {
    if (options.address) {
        eventEmitter.emit("click", options.address);
    }
    else {
        eventEmitter.emit("click", "");
    }
});


