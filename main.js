const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const server = require('./core/server');
const tor = require('./tor/tor');
const User = require('./core/User');
const contact = require('./core/contact');
const config = require('./config');

let mainWindow
let mainWindowSetting = {
    width: 1600, height: 800,
    minWidth: 600, minHeight: 400,
    resizable: true,
    webPreferences: {
        nodeIntegration: true
    }
};
app.on('ready', () => {
    mainWindow = new BrowserWindow(mainWindowSetting);

    mainWindow.loadURL(`file://${__dirname}/ui/index.html`)

    mainWindow.once('ready-to-show', () => { });
    mainWindow.once('close', () => { mainWindow = null; });

    mainWindow.webContents.openDevTools();

    boot();
})

app.on('window-all-closed', () => {
    app.quit();
})

function ipcSendToWindow(window, channel, message) {
    if (window && window.webContents && window.webContents.send) {
        if (message) { window.webContents.send(channel, message); }
        else { window.webContents.send(channel); }
    }
}

//// ------------ Core ------------ ////
async function boot() {
    await server.start();
    tor.start()
        .then(() => {
            ipcSendToWindow(mainWindow, 'bootSucc');
            addUserFromFriendList();
        })
        .catch((err) => {
            console.log(err);
            ipcSendToWindow(mainWindow, 'bootFail');
        })
}

function addUserFromFriendList() {
    const friendList = contact.getFriendList();
    friendList.forEach(address => {
        let hostname = contact.normalizeHostname(address);
        if (contact.checkHostname(hostname)) {
            contact.addUser(address);
        }

        //test
        console.log("wtf", address);
    });
}

//// ------------ IPC on ------------ ////
ipcMain.on('bootInfoReq', (event, message) => {
    event.sender.send("bootInfoRes", {
        progress: tor.getBootstrap(),
        logs: tor.getBootLogs()
    });
});


ipcMain.on('contactReq', (event, message) => {
    event.sender.send("contactRes", {
        friendList: contact.getFriendList(),
        blackList: contact.getBlackList(),
        whiteList: contact.getWhiteList()
    })
})

ipcMain.on('saveContact', (event, message) => {
    contact.setFriendList(message.friendList);
    contact.setBlackList(message.blackList);
    contact.setWhiteList(message.whiteList);

    addUserFromFriendList();

    contact.saveContact();
})



ipcMain.on('settingReq', (event, message) => {
    event.sender.send("settingRes", config.getSetting());
})

ipcMain.on('saveSetting', (event, message) => {
    config.setSetting(message);
    config.saveSetting();
    event.sender.send("settingRes", config.getSetting());
})



ipcMain.on('sendMessage', (event, message) => {
    const address = message.address;
    const msg = message.message;

    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.sendMessage(msg)
            .catch((err) => { console.log(err); })
    }
})

ipcMain.on('sendFile', (event, message) => {
    if (mainWindow) {
        dialog.showOpenDialog(mainWindow, { properties: ['openFile'] }, (files) => {
            if (files && files[0] && files[0].length > 0) {
                const file = files[0];
                const targetUser = contact.findUser(message.address);
                if (targetUser) {
                    targetUser.sendFileSend(file)
                        .catch((err) => { console.log(err); })
                }
            }
        });
    }
});

ipcMain.on('sendFilePath', (event, message) => {
    const targetUser = contact.findUser(message.address);
    if (targetUser) {
        targetUser.sendFileSend(message.path)
            .catch((err) => { console.log(err); })
    }
})

ipcMain.on('acceptFile', (event, message) => {
    const address = message.address;
    const fileID = message.fileID;

    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.sendFileAccept(fileID)
            .catch((err) => { console.log(err); })
    }
});

ipcMain.on('cancelFile', (event, message) => {
    const address = message.address;
    const fileID = message.fileID;

    const targetUser = contact.findUser(address);
    if (targetUser) {
        targetUser.fileCancel(fileID);
    }
});

//// ------------ connect listener to ipc ------------ ////
contact.event.on('newUser', (address) => { ipcSendToWindow(mainWindow, 'newUser', { address }); });
contact.event.on('contactUpdate', (friendList, blackList, whiteList) => {
    ipcSendToWindow(mainWindow, 'contactRes', { friendList, blackList, whiteList });
});

contact.eventUser.on('userConnect', (address) => { ipcSendToWindow(mainWindow, 'userConnect', { address }); });
contact.eventUser.on('userDisconnect', (address) => { ipcSendToWindow(mainWindow, 'userDisconnect', { address }); });
contact.eventUser.on('userAlive', (address, status) => { ipcSendToWindow(mainWindow, 'userAlive', { address, status }); });
contact.eventUser.on('userProfile', (address, name, info) => { ipcSendToWindow(mainWindow, 'userProfile', { address, name, info }); });
contact.eventUser.on('userMessage', (address, message, options) => { ipcSendToWindow(mainWindow, 'userMessage', { address, message, options }); });

contact.eventUser.on('userFileAccept', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileAccept', { address, fileID }); });
contact.eventUser.on('userFileFinished', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileFinished', { address, fileID }); });
contact.eventUser.on('userFileError', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileError', { address, fileID }); });
contact.eventUser.on('userFileCancel', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileCancel', { address, fileID }); });
contact.eventUser.on('userFileData', (address, fileID, accumSize) => { ipcSendToWindow(mainWindow, 'userFileData', { address, fileID, accumSize }); });
contact.eventUser.on('userFileSpeed', (address, fileID, speed) => { ipcSendToWindow(mainWindow, 'userFileSpeed', { address, fileID, speed }); });

