const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');

global.__base = __dirname;

const netServer = require(`${__base}/core/network/netServer`);
const tor = require(`${__base}/tor/tor`);
const netUserList = require(`${__base}/core/netUserList`);

const debug = require(`${__base}/core/debug`);

//// ------------ App ------------ ////
//Security: force sandbox mode
if (process.argv.indexOf('--enable-sandbox') == -1 || process.argv.indexOf('--no-sandbox') > -1) {
    console.log("[Error] Not in sandbox mode. Use --enable-sandbox");
    app.quit(); return;
}

const instanceLock = app.requestSingleInstanceLock()
if (!instanceLock) {
    console.log("[Error] The app is already running");
    app.quit(); return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (!mainWindow) { openMainWindow(); }
    if (mainWindow) {
        if (mainWindow.isMinimized()) { mainWindow.restore(); }
        if (!mainWindow.isVisible()) { mainWindow.show(); }
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
    app.quit();
})

let appQuiting = false;
function appQuit() {
    appQuiting = true;
    app.quit();
}

//// ------------ Main windows ------------ ////
let mainWindow
let mainWindowSetting = {
    width: 1600, height: 800,
    minWidth: 600, minHeight: 400,
    backgroundColor: '#ffffff', //TODO change it depends on theme
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
        mainWindow.on('close', function (event) {
            if (!appQuiting) {
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
}

function showMainWindow() {
    if (mainWindow) { mainWindow.show(); }
}

//// ------------ Tray ------------ ////
let tray = null
app.on('ready', () => {
    tray = new Tray(`${__base}/data/logo.png`); //TODO change this to proper ico icon.
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => { showMainWindow(); } },
        { label: 'Quit', click: () => { appQuit(); } }
    ])
    tray.on('double-click', () => { showMainWindow(); })
    tray.setContextMenu(contextMenu)
    //tray.setToolTip('이것은 나의 애플리케이션 입니다!')
})

//// ------------ Core ------------ ////
async function boot() {
    await netServer.start();

    tor.event.once('success', () => { setInterval(autoAddUser, 1000 * 0.1); });
    tor.event.once('fail', (err) => { debug.log(err); });

    tor.start();
}

function autoAddUser() {
    netUserList.addUserFromFriendList();
}