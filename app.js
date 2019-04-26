const { app, BrowserWindow, ipcMain } = require('electron');

const server = require('./core/server');
const tor = require('./tor/tor');

//// ------------ Windows ------------ ////
let mainWindow;
let mainWindowSetting = {
    width: 1600, height: 800,
    resizable: true,
    webPreferences: {
        nodeIntegration: true
    }
};

app.on('ready', () => {
    mainWindow = new BrowserWindow(mainWindowSetting);
    mainWindow.loadFile(__dirname + '/pages/main.html');

    mainWindow.webContents.openDevTools();

    boot();
})

app.on('window-all-closed', () => {
    app.quit();
})

function ipcSendToWindow(window, channel, message) {
    if (window) {
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
})