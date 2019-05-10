'use strict';

function log() {
    for (let i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}
exports.log = log;