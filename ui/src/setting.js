const { ipcRenderer } = require('electron');

const EventEmitter = require('events');
let eventEmitter = new EventEmitter();
exports.event = eventEmitter;

let value = {};
exports.value = value;

exports.getValue = () => { return value; }
exports.setValue = (newValue) => { value = newValue; }

//test
exports.save = () => { ipcRenderer.send('saveSetting', value); }

exports.fromIPC = (newSetting) => {

    //test
    console.log("newSetting", newSetting);

    value = newSetting;
    eventEmitter.emit('updateUI');
}