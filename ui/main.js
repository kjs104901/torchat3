const fs = require('fs');

const { remote, ipcRenderer } = require('electron');
const { BrowserWindow } = remote;

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

let progress = 0;
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

    $('#tor-status').text("boot fail");
});

function bootFinish() {
    if (!booting) {
        booting = true;

        setContentChat();
        setSideContentUserList();
    }
}

//// ------------ Side Contents ------------ ////
let sideMenuSetting = false;
let userList = [];

ipcRenderer.on('newUser', (event, message) => {
    let address = message.address;
    userList.push({
        address,
        connected: false, status: 0,
        profile: { name: "", info: "" },
        client: { name: "", version: "", },

        messageList: [],
        lastMessageDate: new Date(),
        fileSendList: [], fileRecvList: [],
    })

    // need to sort here

    $('#user-list').empty();
    userList.forEach(user => {
        $('#user-list').append(`<div class='user' address='${user.address}'>${user.address}</div>`)
    });

    $('.user').on('click', function () {
        chatUserAddress = $(this).attr('address');
        showChatRoom(chatUserAddress);
    })
});

//// ------------ Contents ------------ ////
let chatUserAddress = "";

function showChatRoom(address) {
    console.log("showChatRoom", address);

    setContentChat();
}


//// ------------ Actions ------------ ////
function addFriend() {
    const friendAddress = $('#input-friend-address').val();

    ipcRenderer.send('addFriend', {
        address: friendAddress,
    })
}

function sendMessage() {
    if (chatUserAddress.length > 0) {
        const message = $('#input-message').val();
        $('#input-message').val('');

        ipcRenderer.send('sendMessage', {
            address: chatUserAddress,
            message: message
        })
    }
}
