import React from 'react'
import { render } from 'react-dom'
import App from './App.jsx'

import { remote, ipcRenderer } from 'electron';
import userList from './userList';

let app = render(
    <App />,
    document.getElementById('app')
)

//// ------------ Booting ------------ ////
const bootInfoIntv = setInterval(() => { ipcRenderer.send('bootInfoReq'); }, 1000 * 0.1); //second

ipcRenderer.on('bootInfoRes', (event, message) => {
    app.updateBootProgress(message.progress);
    app.updateBootLogs(message.logs);

    if (message.progress >= 100) {
        clearInterval(bootInfoIntv);
        app.bootSuccess();
    }
});

ipcRenderer.on('bootSucc', (event, message) => {
    clearInterval(bootInfoIntv);
    app.bootSuccess();
});

ipcRenderer.on('bootFail', (event, message) => {
    clearInterval(bootInfoIntv);
    bootFail();
    app.bootFailed();
});

//// ------------ data control ------------ ////
ipcRenderer.on('newUser', (event, message) => { userList.addUser(message.address); });

ipcRenderer.on('userConnect', (event, message) => { userList.connect(message.address); })
ipcRenderer.on('userDisconnect', (event, message) => { userList.disconnect(message.address); })
ipcRenderer.on('userAlive', (event, message) => { userList.alive(message.address, message.status); })
ipcRenderer.on('userProfile', (event, message) => { userList.profile(message.address, message.name, message.info); })
ipcRenderer.on('userClient', (event, message) => { userList.client(message.address, message.name, message.version); });
ipcRenderer.on('userMessage', (event, message) => { userList.message(message.address, message.message, message.options); });
