const { app, BrowserWindow, ipcMain } = require('electron');

const server = require('./core/server');
const tor = require('./tor/tor');
const User = require('./core/User');
const contact = require('./core/contact');

//// ------------ Windows ------------ ////
let mainWindow;
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
    mainWindow.loadFile(__dirname + '/ui/main.html');

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

//// ------------ IPC ------------ ////
ipcMain.on('bootInfoReq', (event, message) => {
    event.sender.send("bootInfoRes", {
        progress: tor.getBootstrap(),
        logs: tor.getBootLogs()
    });
});

ipcMain.on('addFriend', (event, message) => {
    contact.addFriend(message.address);
});

// contact listener
contact.event.on('userListUpdate', () => { ipcSendToWindow(mainWindow, 'userListUpdate', { data: contact.getUserListData() }); });
contact.eventUser.on('userConnect', (address) => { ipcSendToWindow(mainWindow, 'userConnect', { address }); });
contact.eventUser.on('userClose', (address) => { ipcSendToWindow(mainWindow, 'userClose', { address }); });
contact.eventUser.on('userAlive', (address, status) => { ipcSendToWindow(mainWindow, 'userAlive', { address, status }); });
contact.eventUser.on('userProfile', (address) => { ipcSendToWindow(mainWindow, 'userProfile', { address }); });
contact.eventUser.on('userMessage', (address, message, options) => { ipcSendToWindow(mainWindow, 'userMessage', { address, message, options }); });
contact.eventUser.on('userFileaccept', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileaccept', { address, fileID }); });
contact.eventUser.on('userFileupdate', (address, fileID) => { ipcSendToWindow(mainWindow, 'userFileupdate', { address, fileID }); });