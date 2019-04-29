const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

let success = false;
let failed = false;

let progress = -1;
let logs = [];

exports.getBootInformation = () => {
    return {
        success,
        failed,

        progress,
        logs
    }
}

exports.setBootInformation = (newProgress, newLogs) => {
    let updated = false;
    if (progress != newProgress) {
        progress = newProgress;
        updated = true;

        if (progress >= 100 && !success) {
            success = true;
            eventEmitter.emit('finished');
        }
    }
    if (logs.length != newLogs.length) {
        logs = newLogs;
        updated = true;
    }
    if (updated) {
        eventEmitter.emit('updated');
    }
}

exports.setSuccess = () => {
    if (!success) {
        success = true;
        eventEmitter.emit('finished');
    }
}

exports.setFailed = () => {
    if (!failed) {
        failed = true;
        eventEmitter.emit('finished');
    }
}