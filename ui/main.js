const fs = require('fs');

const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

window.$ = window.jQuery = require('jquery');
require('popper.js');
require('bootstrap');

//// ------------ html Modules ------------ ////
const htmlModule = {};
htmlModule.boot = fs.readFileSync(__dirname + '/mBoot.html');
htmlModule.chat = fs.readFileSync(__dirname + '/mChat.html');

//// ------------ Booting ------------ ////
const bootInfoIntv = setInterval(() => {
    ipcRenderer.send('bootInfoReq');
}, 100);

let progress = 0;
let logs = [];
ipcRenderer.on('bootInfoRes', (event, message) => {
    if (progress >= 100) {
        clearInterval(bootInfoIntv);
        $("#content").html('boot succ');
    }

    if (progress != message.progress) {
        progress = message.progress;
        $("#tor-status").text(progress);
    }
    if (logs.length < message.logs.length) {
        logs = message.logs;
        $("#tor-logs").html(logs.join('<br><br>'));
    }
});

ipcRenderer.on('bootSucc', (event, message) => {
    clearInterval(bootInfoIntv);

    $("#content").html('boot succ');
});

ipcRenderer.on('bootFail', (event, message) => {
    clearInterval(bootInfoIntv);

    $("#content").html('boot fail');
});

//// ------------ Chatting ------------ ////



//// ------------ Chatting ------------ ////