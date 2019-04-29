const { app, BrowserWindow, dialog } = require('electron');

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

//// ------------ Core ------------ ////
async function boot() {
    await server.start();
    tor.start();

    tor.event.once('success', () => { contact.addUserFromFriendList(); });
    tor.event.once('fail', () => { console.log(err); });
}