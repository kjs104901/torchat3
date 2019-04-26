const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

window.$ = window.jQuery = require('jquery');

setInterval(() => {
    ipcRenderer.send('bootInfoReq');
}, 100);

ipcRenderer.on('bootInfoRes', (event, message) => {
    $("#tor-status").text(message.progress);
    $("#tor-logs").html(message.logs.join('<br><br>'))
})
