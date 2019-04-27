const fs = require('fs');

const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

const userList = require('./userList');

window.$ = window.jQuery = require('jquery');
require('popper.js');
require('bootstrap');

//// ------------ html Modules ------------ ////
const htmlBoot = fs.readFileSync(__dirname + '/mBoot.html', { encoding: "utf8" });
const htmlChat = fs.readFileSync(__dirname + '/mChat.html', { encoding: "utf8" });
const htmlUserList = fs.readFileSync(__dirname + '/mUserList.html', { encoding: "utf8" });

function setContentBoot() { $('#content').html(htmlBoot); }

function setContentChat() {
    $('#content').html(htmlChat);
    $('#button-message-send').on("click", sendMessage);
}

function setSideContentUserList() {
    $('#side-content').html(htmlUserList);
    $('#button-add-friend').on("click", addFriend);
}

//// ------------ Booting ------------ ////
let booting = false;
setContentBoot()

const bootInfoIntv = setInterval(() => {
    ipcRenderer.send('bootInfoReq');
}, 100);

let progress = -1;
let logs = [];
ipcRenderer.on('bootInfoRes', (event, message) => {
    if (progress >= 100) {
        clearInterval(bootInfoIntv);
        bootFinish();
    }

    if (progress != message.progress) {
        progress = message.progress;
        $("#tor-status").text(progress);
    }
    if (logs.length < message.logs.length) {
        logs = message.logs;
        $("#tor-logs").html(logs.join('<br><br>'));
    }
});

ipcRenderer.on('bootSucc', (event, message) => {
    clearInterval(bootInfoIntv);
    bootFinish();
});

ipcRenderer.on('bootFail', (event, message) => {
    clearInterval(bootInfoIntv);
    bootFail();
});

function bootFinish() {
    if (!booting) {
        booting = true;
        showChatPage();
    }
}

function bootFail() {
    $('#tor-status').text("boot fail");
}

//// ------------ data control ------------ ////
ipcRenderer.on('newUser', (event, message) => {
    const newUser = userList.addUser(message.address);
    addUserList(newUser);
    sortUserList();
});

ipcRenderer.on('userConnect', (event, message) => {
    const targetUser = userList.connect(message.address);
    updateUserList(targetUser);
    sortUserList();
})

ipcRenderer.on('userDisconnect', (event, message) => {
    const targetUser = userList.disconnect(message.address);
    updateUserList(targetUser);
    sortUserList();
})

ipcRenderer.on('userAlive', (event, message) => {
    const targetUser = userList.alive(message.address, message.status);
    updateUserList(targetUser);
    sortUserList();
})

ipcRenderer.on('userProfile', (event, message) => {
    const targetUser = userList.profile(message.address, message.name, message.info);
    updateUserList(targetUser);
})

ipcRenderer.on('userClient', (event, message) => {
    userList.client(message.address, message.name, message.version);
});

ipcRenderer.on('userMessage', (event, message) => {
    userList.message(message.address, message.message, message.options);
});

//// ------------ Contents ------------ ////
let settingMenu = false;
let selectedSettingMenu = 0;

function switchMenu() {
    if (settingMenu) {
        showChatPage();
        settingMenu = false;
    }
    else {
        showSettingPage();
        settingMenu = true;
        selectedSettingMenu = 0;
    }
}

function showChatPage() {
    showSideContentUserList();
    showContentChat();
}

function showSettingPage() {

}

//// ------------ Side Contents ------------ ////
function showSideContentUserList() {
    setSideContentUserList();
    userList.getList().forEach(user => {
        addUserList(user);
    });
}

function addUserList(user) {
    if (user) {
        $('#user-list')
            .append(`
                <div class='user'
                    address='${user.address}'
                    connected='${user.connected}'
                    status='${user.status}'>
                        <span class='user-name'>${user.profile.name}</span>
                        <span class='user-address'>${user.address}</span>
                </div>`)
            .children(`[address='${user.address}']`).on('click', function () {
                selectUser($(this).attr('address'));
            })
    }
}

function sortUserList() {
    const parent = $('#user-list');
    let items = parent.children('div').sort(function(userA, userB) {
        return userList.compareUser(userA, userB);
    });
    parent.append(items);
}

function updateUserList(user) {
    if (user) {
        $('#user-list').children(`[address='${user.address}']`)
            .attr("connected", user.connected)
            .attr("status", user.status)
            .children('.user-name')
                .text(user.profile.nam)
    }
}

let selectedUser;
function selectUser(address) {
    selectedUser = userList.findUser(address);

    showContentChat();
}

//// ------------ Main Contents ------------ ////

function showContentChat() {
    setContentChat();
    if (selectedUser) {
        
    }
}



//// ------------ Actions ------------ ////
function addFriend() {
    const friendAddress = $('#input-friend-address').val();

    ipcRenderer.send('addFriend', {
        address: friendAddress,
    })
}

function sendMessage() {
    if (selectedUser) {
        const message = $('#input-message').val();
        $('#input-message').val('');

        ipcRenderer.send('sendMessage', {
            address: selectedUser.address,
            message: message
        })
    }
}
