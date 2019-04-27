let userList = [];

class User {
    constructor(address) {
        this.address = address;
        this.connected = false;
        this.status = 0;
        this.profile = {name:"", info: ""};
        this.client= { name: "", version: "" }

        this.messageList = [];
        this.lastMessageDate = new Date();
        this.fileSendList = [];
        this.fileRecvList = [];
    }
}

exports.getList = () => {
    return userList;
}

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
        return targetUser;
    }
}

exports.connect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.connected = true;
        return targetUser;
    }
}

exports.disconnect = (address) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.connected = false;
        return targetUser;
    }
}

exports.alive = (address, status) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.status = status;
        return targetUser;
    }
}

exports.profile = (address, name, info) => {
    const targetUser = findUser(address);
    if (targetUser) {
        targetUser.profile.name = name;
        targetUser.profile.info = info;
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
        targetUser.messageList.push({ message, options });
        targetUser.lastMessageDate = new Date();
        return targetUser;
    }
}