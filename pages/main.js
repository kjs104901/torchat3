const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

window.$ = window.jQuery = require('jquery');
require('popper.js');
require('bootstrap');


setInterval(() => {
    ipcRenderer.send('bootInfoReq');
}, 100);

let progress = 0;
let logs = [];
ipcRenderer.on('bootInfoRes', (event, message) => {
    if (progress != message.progress) {
        progress = message.progress;
        $("#tor-status").text(progress);
    }
    if (logs.length < message.logs.length) {
        logs = message.logs;
        $("#tor-logs").html(logs.join('<br><br>'));
    }
})
