const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');

let mainWindow;
let mainWindowSetting = {
    width: 840, height: 630,
    resizable: true,
};

app.on('ready', () => {
    mainWindow = new BrowserWindow(mainWindowSetting);
    mainWindow.loadFile('./html/main.html');
})


app.on('window-all-closed', () => {
    app.quit();
})