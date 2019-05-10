const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');

global.__base = __dirname;

const netServer = require(`${__base}/core/network/netServer`);
const netUserList = require(`${__base}/core/netUserList`);
const notification = require(`${__base}/core/notification`);
const fileHandler = require(`${__base}/core/fileIO/fileHandler`);
const parser = require(`${__base}/core/network/parser`);
const config = require(`${__base}/core/config`);
const langs = require(`${__base}/core/langs`);
const debug = require(`${__base}/core/debug`);
const tor = require(`${__base}/tor/tor`);

//// ------------ App ------------ ////
//Security: force sandbox mode
if (process.argv.indexOf('--enable-sandbox') === -1 || process.argv.indexOf('--no-sandbox') > -1) {
    console.log("[Error] Not in sandbox mode. Use --enable-sandbox");
    app.quit();
    return;
}

const instanceLock = app.requestSingleInstanceLock()
if (!instanceLock) {
    console.log("[Error] The app is already running");
    app.quit();
    return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (!mainWindow) { openMainWindow(); }
    if (mainWindow) {
        if (mainWindow.isMinimized()) { mainWindow.restore(); }
        if (!mainWindow.isVisible()) { showMainWindow(); }
        mainWindow.focus()
    }
})


//Security: set a fake proxy to prevent the app from connecting to internet
const fakeProxy = 'null://255.255.255.0:65535'
app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1'); // map every hostname to local host
app.commandLine.appendSwitch('proxy-server', fakeProxy);
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-plugins');
app.commandLine.appendSwitch('disable-bundled-ppapi-flash');

app.on('ready', () => {
    openMainWindow();
    boot();
})

app.on('window-all-closed', () => {
    appQuit();
})

app.on('will-quit', () => {
    fileHandler.cleanTempDir();
})

let appQuiting = false;
function appQuit() {
    appQuiting = true;
    app.quit();
}

//// ------------ Main windows ------------ ////
let mainWindow
let mainWindowHided = false;
let mainWindowSetting = {
    width: 1600, height: 800,
    minWidth: 350, minHeight: 460,
    backgroundColor: '#ffffff',
    resizable: true,
    webPreferences: {
        sandbox: true,
        preload: path.join(__dirname, 'ui/src/preload.js')
    }
};

function openMainWindow() {
    if (!mainWindow) {
        mainWindow = new BrowserWindow(mainWindowSetting);

        //Security: set a fake proxy to prevent the app from connecting to internet
        mainWindow.webContents.session.setProxy({ proxyRules: fakeProxy }, () => {
            mainWindow.loadURL(`file://${__dirname}/ui/index.html`);
        });

        //Security: prevent the page from navigating to another web page.
        mainWindow.webContents.on('will-navigate', (event, url) => { event.preventDefault(); })
        mainWindow.webContents.on('will-redirect', (event, url) => { event.preventDefault(); })

        mainWindow.once('ready-to-show', () => { });
        mainWindow.on('close', (event) => {
            if (!appQuiting && config.getSetting().minimizeToTray) {
                event.preventDefault();
                hideMainWindow();
            }
            return false;
        });

        mainWindow.webContents.openDevTools();
    }
}

function hideMainWindow() {
    if (mainWindow) { mainWindow.hide(); }
    mainWindowHided = true;
    notification.clearHistory();
}

function showMainWindow() {
    mainWindowHided = false;
    if (mainWindow) { mainWindow.show(); }
}

//// ------------ Tray ------------ ////
let tray = null
app.on('ready', () => {
    tray = new Tray(`${__base}/data/logoTray.png`);
    const contextMenu = Menu.buildFromTemplate([
        { label: langs.get('TrayMenuOpen'), click: () => { showMainWindow(); } },
        { label: langs.get('TrayMenuQuit'), click: () => { appQuit(); } }
    ])
    tray.on('double-click', () => { showMainWindow(); })
    tray.setContextMenu(contextMenu);
})

//// ------------ Notifications ------------ ////
netUserList.event.on('userSocketBothConnected', (address) => {
    if (mainWindowHided && config.getSetting().notification) {
        if (parser.isMyHostname(address)) {
            notification.notify("", "Tor", langs.get('NotificationConnected'));
        }
        else {
            notification.newConnection(address);
        }
    }
})

netUserList.event.on('userMessage', (address, message, options) => {
    if (mainWindowHided && config.getSetting().notification) {
        notification.newMessage(address, message);
    }
});

notification.event.on('click', (address) => {
    showMainWindow();
})

//// ------------ Core ------------ ////
async function boot() {
    await netServer.start();

    tor.event.once('success', () => {
        setInterval(autoAddUser, 1000 * 0.1);
    });
    tor.event.once('fail', (err) => { debug.log(err); });

    tor.start();
}

function autoAddUser() {
    netUserList.addUserFromFriendList();
}