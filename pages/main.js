const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

window.$ = window.jQuery = require('jquery');

$("#tor-status").text("hello world!");