'use strict';

let logAvailable = false;
exports.setLogAvailable = (value) => {
    logAvailable = value;
}

function log() {
    if (!logAvailable) { return }
    for (let i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}
exports.log = log;