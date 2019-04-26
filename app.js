const { app, BrowserWindow, ipcMain } = require('electron');

const server = require(__dirname + '/core/server');
const tor = require(__dirname + '/tor/tor');



//// ------------ Windows ------------ ////
let mainWindow;
let mainWindowSetting = {
    width: 1400, height: 630,
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

//// ------------ Core ------------ ////
async function boot() {
    await server.start();

    if (mainWindow) {

    }
}
//// ------------ IPC ------------ ////

ipcMain.on('', (event, message) => {

})