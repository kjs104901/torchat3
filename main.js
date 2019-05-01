const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

const server = require('./core/server');
const tor = require('./tor/tor');
const contact = require('./core/contact');

//Security: force sandbox mode
if (process.argv.indexOf('--enable-sandbox') == -1 || process.argv.indexOf('--no-sandbox') > -1) {
    console.log("[Error] Not in sandbox mode!");
    app.quit();
    return;
}

let mainWindow
let mainWindowSetting = {
    width: 1600, height: 800,
    minWidth: 600, minHeight: 400,
    resizable: true,
    webPreferences: {
        sandbox: true,
        preload: path.join(__dirname, 'ui/src/preload.js')
    }
};

//Security: set a fake proxy to prevent the app from connecting to internet
const fakeProxy = 'null://255.255.255.0:65535'
app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1'); // map every hostname to local host
app.commandLine.appendSwitch('proxy-server', fakeProxy);
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-plugins');
app.commandLine.appendSwitch('disable-bundled-ppapi-flash');

app.on('ready', () => {
    mainWindow = new BrowserWindow(mainWindowSetting);

    //Security: set a fake proxy to prevent the app from connecting to internet
    mainWindow.webContents.session.setProxy({ proxyRules: fakeProxy }, () => {
        mainWindow.loadURL(`file://${__dirname}/ui/index.html`);
    });

    //Security: prevent the page from navigating to another web page.
    mainWindow.webContents.on('will-navigate', (event, url) => { event.preventDefault(); })
    mainWindow.webContents.on('will-redirect', (event, url) => { event.preventDefault(); })

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

    tor.event.once('success', () => { setInterval(autuAddUser, 1000 * 0.1); });
    tor.event.once('fail', () => { console.log("failed"); });
}

function autuAddUser() {
    contact.addUserFromFriendList();
}