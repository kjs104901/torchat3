const parser = require('./parser');
const debug = require('./debug');

function isSocketOkay(socket) {
    if (socket && !socket.destroyed) {
        return true;
    }
    debug.log("Socket Error");
    return false;
}

exports.ping = (socket, publicKeyStr, randomStr, signedStr) => {
    if (isSocketOkay(socket)) {
        socket.write("ping " + publicKeyStr + ' ' + randomStr + ' ' + signedStr + '\n');
    }
}

exports.pong = (socket, randomStr, clientName, clientVersion) => {
    if (isSocketOkay(socket)) {
        socket.write("pong " + randomStr + ' ' + clientName + ' ' + clientVersion + '\n');
    }
}

exports.alive = (socket, userStatus) => {
    if (isSocketOkay(socket)) {
        socket.write("alive " + userStatus + '\n');
    }
}

exports.profile = (socket, profileName, profileInfo) => {
    if (isSocketOkay(socket)) {
        socket.write("profile " + parser.escape(profileName) + ' ' + parser.escape(profileInfo) + '\n');
    }
}

exports.message = (socket, message) => {
    if (isSocketOkay(socket)) {
        socket.write("message " + parser.escape(message) + '\n');
    }
}

exports.filesend = (socket, fileID, fileSize, fileName) => {
    if (isSocketOkay(socket)) {
        socket.write("filesend " + fileID + ' ' + fileSize + ' ' + parser.escape(fileName) + '\n');
    }
}

exports.fileaccept = (socket, fileID) => {
    if (isSocketOkay(socket)) {
        socket.write("fileaccept " + fileID + '\n');
    }
}

exports.fileokay = (socket, fileID, blockIndex) => {
    if (isSocketOkay(socket)) {
        socket.write("fileokay " + fileID + ' ' + blockIndex + '\n');
    }
}

exports.fileerror = (socket, fileID, blockIndex) => {
    if (isSocketOkay(socket)) {
        socket.write("fileerror " + fileID + ' ' + blockIndex + '\n');
    }
}

exports.filecancel = (socket, fileID) => {
    if (isSocketOkay(socket)) {
        socket.write("filecancel " + fileID + '\n');
    }
}

exports.filedata = (socket, fileID, blockIndex, blockHash, blockData) => {
    if (isSocketOkay(socket)) {
        return socket.write("filedata " + fileID + ' ' + blockIndex + ' ' + blockHash + ' ' + parser.escape(blockData) + '\n', 'binary');
    }
}


exports.validate = (dataList) => {
    let isValid = false;
    switch (dataList[0]) {
        case 'ping': isValid = (dataList.length == 4); break;
        case 'pong': isValid = (dataList.length == 4); break;
        case 'alive': isValid = (dataList.length == 2); break;
        case 'profile': isValid = (dataList.length == 3); break;
        case 'message': isValid = (dataList.length == 2); break;
        case 'filesend': isValid = (dataList.length == 4); break;
        case 'fileaccept': isValid = (dataList.length == 2); break;
        case 'fileokay': isValid = (dataList.length == 3); break;
        case 'fileerror': isValid = (dataList.length == 3); break;
        case 'filecancel': isValid = (dataList.length == 2); break;
        case 'filedata': isValid = (dataList.length == 5); break;
        default: isValid = true;  break;
    }
    if (!isValid) { debug.log("Invalid dataList", dataList); }
    return isValid;
}