import React from 'react'
import { render } from 'react-dom'
import App from './App.jsx'

import { remote, ipcRenderer } from 'electron';
import userList from './userList';
import setting from './setting';
import boot from './boot';

let app = render(
    <App />,
    document.getElementById('app')
)

//// ------------ data control ------------ ////
// Booting
const bootInfoIntv = setInterval(() => { ipcRenderer.send('bootInfoReq'); }, 1000 * 0.1); //second
boot.event.on('finished', () => { clearInterval(bootInfoIntv); })

ipcRenderer.on('bootInfoRes', (event, message) => { boot.setBootInformation(message.progress, message.logs) });
ipcRenderer.on('bootSucc', (event, message) => { boot.setSuccess(); });
ipcRenderer.on('bootFail', (event, message) => { boot.setFailed(); });

// Users
ipcRenderer.on('newUser', (event, message) => { userList.addUser(message.address); });

ipcRenderer.on('userConnect', (event, message) => { userList.connect(message.address); })
ipcRenderer.on('userDisconnect', (event, message) => { userList.disconnect(message.address); })
ipcRenderer.on('userAlive', (event, message) => { userList.alive(message.address, message.status); })
ipcRenderer.on('userProfile', (event, message) => { userList.profile(message.address, message.name, message.info); })
ipcRenderer.on('userClient', (event, message) => { userList.client(message.address, message.name, message.version); });
ipcRenderer.on('userMessage', (event, message) => { userList.message(message.address, message.message, message.options); });

// Files
ipcRenderer.on('userFileAccept', (event, message) => { userList.fileAccept(message.address, message.fileID) });
ipcRenderer.on('userFileFinished', (event, message) => { userList.fileFinished(message.address, message.fileID) });
ipcRenderer.on('userFileError', (event, message) => { userList.fileError(message.address, message.fileID) });
ipcRenderer.on('userFileCancel', (event, message) => { userList.fileCancel(message.address, message.fileID) });
ipcRenderer.on('userFileData', (event, message) => { userList.fileData(message.address, message.fileID, message.accumSize) });
ipcRenderer.on('userFileSpeed', (event, message) => { userList.fileSpeed(message.address, message.fileID, message.speed) });

// Contacts and Settings
ipcRenderer.send('contactReq');
ipcRenderer.on('contactRes', (event, message) => { userList.contactUpdate(message.friendList, message.blackList, message.whiteList) });

ipcRenderer.send('settingReq');
ipcRenderer.on('settingRes', (event, message) => { setting.fromIPC(message) })
