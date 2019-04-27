const { app, BrowserWindow, ipcMain } = require('electron');

const server = require('./core/server');
const tor = require('./tor/tor');
const User = require('./core/User');
const contact = require('./core/contact');

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
            ipcSendToWindow(mainWindow, 'bootSucc')
        })
        .catch((err) => {
            console.log(err);
            ipcSendToWindow(mainWindow, 'bootFail')
        })
}

//// ------------ IPC on ------------ ////
ipcMain.on('bootInfoReq', (event, message) => {
    event.sender.send("bootInfoRes", {
        progress: tor.getBootstrap(),
        logs: tor.getBootLogs()
    });
});

ipcMain.on('addFriend', (event, message) => {
    contact.addFriend(message.address);
});

ipcMain.on('sendMessage', (event, message) => {
    const address = message.address;
    const msg = message.message;

    const targetUser = contact.findUser(address);
    if (targetUser) {
        //test
        console.log(msg);
        
        targetUser.sendMessage(msg)
            .catch((err) => {
                console.log(err);
            })
    }
})

//// ------------ contact listener to ipc ------------ ////
contact.event.on('newUser', (address) => { ipcSendToWindow(mainWindow, 'newUser', { address }); });

contact.eventUser.on('userConnect', (address) => { ipcSendToWindow(mainWindow, 'userConnect', { address }); });
contact.eventUser.on('userDisconnect', (address) => { ipcSendToWindow(mainWindow, 'userDisconnect', { address }); });
contact.eventUser.on('userAlive', (address, status) => { ipcSendToWindow(mainWindow, 'userAlive', { address, status }); });
contact.eventUser.on('userProfile', (address, name, info) => { ipcSendToWindow(mainWindow, 'userProfile', { address, name, info }); });
contact.eventUser.on('userMessage', (address, message, options) => { ipcSendToWindow(mainWindow, 'userMessage', { address, message, options }); });

contact.eventUser.on('userFileAccept', (address, fileType, fileID) => { ipcSendToWindow(mainWindow, 'userFileAccept', { address, fileType, fileID }); });
contact.eventUser.on('userFileFinished', (address, fileType, fileID) => { ipcSendToWindow(mainWindow, 'userFileFinished', { address, fileType, fileID }); });
contact.eventUser.on('userFileError', (address, fileType, fileID) => { ipcSendToWindow(mainWindow, 'userFileError', { address, fileType, fileID }); });
contact.eventUser.on('userFileCancle', (address, fileType, fileID) => { ipcSendToWindow(mainWindow, 'userFileCancle', { address, fileType, fileID }); });
contact.eventUser.on('userFileData', (address, fileType, fileID, dataSize, accumSize) => { ipcSendToWindow(mainWindow, 'userFileData', { address, fileType, fileID, dataSize, accumSize }); });

/* */