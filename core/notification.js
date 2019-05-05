const notifier = require('node-notifier');

const contact = require(`${__base}/core/contact`);

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

let newMessageList = [];
let newConnectionList = [];

exports.newMessage = (address, message) => {
    if (newMessageList.indexOf(address) == -1) {
        newMessageList.push(address);

        let nickname = contact.getNickname(address);
        if (nickname.length == 0) { nickname = "tc3:" + address; }

        notify(address, nickname, message)
    }
}

exports.newConnection = (address) => {
    if (newConnectionList.indexOf(address) == -1) {
        newConnectionList.push(address);

        let nickname = contact.getNickname(address);
        if (nickname.length == 0) { nickname = "tc3:" + address; }
        
        //LANG
        notify(address, "New connection", nickname)
    }
}

exports.clearHistory = () => {
    newMessageList = [];
    newConnectionList = [];
}

//TODO icon 넣을 수 있으면 넣기 icon: path.join(__dirname, 'coulson.jpg'),
function notify(address, title, message) {
    if (message.length > 50) { message = message.substr(0, 50) + "..."; }
    if (title.length > 30) { title = title.substr(0, 30) + "..."; }

    notifier.notify({
        address, title, message,
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


