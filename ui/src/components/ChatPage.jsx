import React, { Component } from 'react'
import PropTypes from 'prop-types';
import FileDrop from 'react-file-drop';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

import PerfectScrollbar from 'react-perfect-scrollbar'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

import ChatMessage from './ChatMessage';

import imgAddContact from '../assets/addContact.png'
import imgAddWhite from '../assets/addWhite.png'
import imgBlackWhite from '../assets/blackWhite.png'
import imgClose from '../assets/close.png'
import imgCopy from '../assets/copy.png'
import imgPaste from '../assets/paste.png'
import imgSend from '../assets/send.png'
import imgSetting from '../assets/setting.png'
import imgUpload from '../assets/upload.png'

//test temp example
/**
MySwal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'okay',
    cancelButtonText: 'cancel',
    heightAuto: false,
    width: 400,
}).then((result) => {
    if (result.value) {
        MySwal.fire({
            title: 'Deleted!',
            text: 'Your file has been deleted.',
            heightAuto: false,
            width: 400,
        })
    }
})
*/


export default class ChatPage extends Component {
    constructor(props) {
        super(props);

        this.scrollRef = null;
        this.scrollReachEnd = true;

        this.state = {
            selectedUser: null,
            inputUserAddress: "",
            inputMessage: "",
        };
    };

    componentDidMount() {
        userList.event.on('updated', this.updateUI);
        remoteControl.event.on('contactUpdate', this.updateUI);
        remoteControl.event.on('chatError', this.showError);
        remoteControl.event.on('contactError', this.showError);
        remoteControl.event.on('clickUser', this.selectUserByAddress);
    }

    componentWillUnmount() {
        userList.event.removeListener('updated', this.updateUI);
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
        remoteControl.event.removeListener('chatError', this.showError);
        remoteControl.event.removeListener('contactError', this.showError);
        remoteControl.event.removeListener('clickUser', this.selectUserByAddress);
    }

    updateUI = () => {
        this.forceUpdate();

        if (this.scrollRef) {
            if (this.scrollReachEnd) {
                this.scrollRef.scrollTop = this.scrollRef.scrollHeight;
            }
        }
    }

    showError = (err) => {
        if (err) {
            console.log(err);
            let errStr = err.message;
            if (errStr) {
                MySwal.fire({
                    title: 'Error',
                    text: errStr,
                    heightAuto: false,
                    width: 400,
                })
            }
        }
    }

    selectUserByAddress = (address) => {
        if (address && address.length > 0) {
            const user = userList.findUser(address);
            if (user) { this.setState({ selectedUser: user }) }
        }
    }

    addFriendInput = () => { remoteControl.addFriend(this.state.inputUserAddress); }

    addFriend = (targetAddress) => { remoteControl.addFriend(targetAddress); }
    removeFriend = (targetAddress) => { remoteControl.removeFriend(targetAddress); }
    setNicknameDialog = (targetAddress) => {
        let inputValue = remoteControl.getNickname(targetAddress);
        MySwal.fire({
            title: 'Add nickname test',
            input: 'text',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            inputValue: inputValue,
            showCancelButton: true,
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result) {
                let nickname = result.value;
                if (nickname) {
                    remoteControl.setNickname(targetAddress, nickname);
                }
                else if (!result.dismiss) {
                    remoteControl.setNickname(targetAddress, "");
                }
            }
        })
    }
    addBlack = (targetAddress) => { remoteControl.addBlack(targetAddress); }
    removeBlack = (targetAddress) => { remoteControl.removeBlack(targetAddress); }

    sendMessage = () => {
        if (this.state.selectedUser && this.state.inputMessage.length > 0) {
            if (this.state.inputMessage.length > remoteControl.MaxLenChatMessage) {
                this.showError(new Error("can't send over char: " + remoteControl.MaxLenChatMessage));
            }
            else {
                remoteControl.sendMessage(this.state.selectedUser.address, this.state.inputMessage);
                this.setState({
                    inputMessage: ""
                })
            }
        }
    }

    sendFileDialog = () => {
        if (this.state.selectedUser) {
            remoteControl.sendFileDialog(this.state.selectedUser.address);
        }
    }

    sendFile = (path) => {
        if (this.state.selectedUser) {
            remoteControl.sendFile(this.state.selectedUser.address, path)
        }
    }

    renderAlert = () => {
        if (this.state.selectedUser) {
            const targetUser = this.state.selectedUser;
            if (!remoteControl.isFriend(targetUser.address)) {
                return (
                    <div className="friend-alert">
                        <div className="friend-alert__text">This is not a friend.</div>
                        <div className="friend-alert__button"
                            onClick={() => { this.addBlack(targetUser.address) }}>
                            <img className="image-button size30margin10" src={imgBlackWhite} />
                        </div>
                        <div className="friend-alert__button"
                            onClick={() => { this.addFriend(targetUser.address) }}>
                            <img className="image-button size30margin10" src={imgAddWhite} />
                        </div>
                    </div>
                )
            }
        }
    }

    renderUserList = () => {
        let row = [];

        let targetUserList = userList.getList();
        targetUserList.sort((a, b) => { return userList.compareUser(a, b); });

        targetUserList.forEach((user, index) => {
            let selected = false;
            if (user == this.state.selectedUser) { selected = true; }

            let color = '';
            if (user.socketOutConnected && user.socketInConnected) { color = 'green'; }
            else if (user.socketOutConnected || user.socketInConnected) { color = 'yellow'; }

            let name = remoteControl.getUserName(user.address);

            let lastMessage;
            if (user.lastMessage.length > 0) { lastMessage = user.lastMessage; }

            row.push(
                <div className={selected ? "user selected" : "user"} key={index}
                    onClick={() => { this.setState({ selectedUser: user }) }}>
                    <div className="profile__head">
                        <div className={"profile__head__background " + color}></div>
                        <img className="image-button profile__head__picture"
                            src={"data:image/svg+xml;base64," + user.profile.image} />
                    </div>
                    <div className="profile__body">
                        <div className={"profile__body__nickname " + (lastMessage ? '' : 'alone')}>{name}</div>
                        {lastMessage ?
                            <div className="profile__body__last-message">{lastMessage}</div>
                            : ''}
                    </div>
                </div>
            )
        });
        return row;
    }

    renderMessages = () => {
        let row = [];
        if (this.state.selectedUser) {
            this.state.selectedUser.messageList.forEach((message, index) => {
                row.push(
                    <ChatMessage
                        selectedUser={this.state.selectedUser}
                        message={message}
                        key={index} />
                )
            });
        }
        return (
            <div className="message-list-inner">
                <div style={{ height: 300 }}></div>
                <div>{row}</div>
            </div>
        );
    }

    handleDrop = (files, event) => {
        if (files.length > 10) {
            this.showError(new Error("more than 10 files"))
        }
        else {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                this.sendFile(file.path);
            }
        }
    }

    handleKeyPress = (event) => {
        if ((event.keyCode == 10 || event.keyCode == 13)) {
            if (event.ctrlKey) {
                this.setState({ inputMessage: this.state.inputMessage + "\n" })
            }
            else {
                this.sendMessage();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    render() {
        // myself
        let myAddress = remoteControl.getHostname();

        let myName = "";
        const myProfileName = remoteControl.getSetting().profileName;
        if (myProfileName) { myName = myProfileName; }
        if (myName.length == 0) { myName = "tc3:" + myAddress }

        const myProfileInfo = remoteControl.getSetting().profileInfo;

        let myselfUser = userList.findUser(myAddress);

        let myColor = "";
        let myProfileImage = "";
        if (myselfUser) {
            if (myselfUser.socketOutConnected && myselfUser.socketInConnected) { myColor = 'green'; }
            else if (myselfUser.socketOutConnected || myselfUser.socketInConnected) { myColor = 'yellow'; }
            else { myColor = 'red' }

            myProfileImage = myselfUser.profile.image;
        }

        // selected
        let selectedUser;
        let selectedAddress = "";
        let selectedProfileImage = "";
        let selectedName = "";

        if (this.state.selectedUser) {
            selectedUser = this.state.selectedUser;
            if (selectedUser) {
                selectedAddress = selectedUser.address;
                selectedName = remoteControl.getUserName(selectedAddress);
                selectedProfileImage = selectedUser.profile.image;
            }
        }

        return (
            <React.Fragment>
                <div id='side-bar'>
                    <div id='side-menu'>
                        <div className="myself">
                            <div className="profile__head">
                                <div className={"profile__head__background " + myColor}></div>
                                <img className="image-button profile__head__picture"
                                    src={"data:image/svg+xml;base64," + myProfileImage} />
                            </div>
                            <div className="profile__body">
                                <div className="profile__body__nickname">{myName}</div>
                                <div className="profile__body__last-message">{myProfileInfo}</div>
                            </div>
                        </div>

                        <div className="my-address">
                            <div className="my-address__address dragable">
                                {"tc3:" + myAddress}
                            </div>
                            <div style={{ float: 'left', width: 30 }}
                                onClick={() => { remoteControl.setClipboard(myAddress) }}>
                                <img className="image-button size20margin5" src={imgCopy} />
                            </div>
                        </div>
                        <div className="menu-select">
                            <div className="menu-select__item selected" onClick={() => { this.props.selectPage(1) }}>
                                chat
                            </div>
                            <div className="menu-select__item" onClick={() => { this.props.selectPage(2) }}>
                                setting
                            </div>
                        </div>
                    </div>
                    <div id='side-content'>
                        <div id='user-list-menu'>
                            <div style={{ float: 'left', width: 30, marginTop: 4 }}
                                onClick={
                                    () => { this.setState({ inputUserAddress: remoteControl.getClipboard() }) }
                                }>
                                <img className="image-button size20margin5" src={imgPaste} />
                            </div>
                            <div id='contact-input-block'>
                                <input style={{ width: 125 }} type="text"
                                    value={this.state.inputUserAddress}
                                    onChange={(e) => { this.setState({ inputUserAddress: e.target.value }) }} />
                            </div>
                            <div style={{ float: 'left', width: 30, marginTop: 4 }} onClick={() => { this.addFriendInput() }}>
                                <img className="image-button size20margin5" src={imgAddContact} />
                            </div>
                        </div>
                        <PerfectScrollbar id='user-list' style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                            {this.renderUserList()}
                        </PerfectScrollbar>
                    </div>
                </div>
                <div id='content'>
                    {selectedUser ?
                        <FileDrop onDrop={this.handleDrop}>
                            <div id='content__header'>
                                <img id="content__header__picture" className="image-button"
                                    src={"data:image/svg+xml;base64," + selectedProfileImage} />
                                <div id='content__header__info'>
                                    <div id='content__header__info__nickname'>
                                        {selectedName}
                                    </div>
                                    <div id='content__header__info__address' className='dragable'>
                                        {"tc3:" + selectedAddress}
                                    </div>
                                </div>
                                <div id='content__header__button'>
                                    <img className="image-button size30margin10" src={imgSetting} />
                                </div>
                            </div>
                            {this.renderAlert()}
                            <div id='message-list'>
                                <PerfectScrollbar
                                    containerRef={(ref) => { this.scrollRef = ref; }}
                                    style={{ width: '100%', height: '100%' }}
                                    onScrollUp={() => { this.scrollReachEnd = false; }}
                                    onYReachEnd={() => { this.scrollReachEnd = true; }}>
                                    {this.renderMessages()}
                                </PerfectScrollbar>
                            </div>
                            <div id='message-input'>
                                <div style={{ float: "left", width: 30, height: 40 }}
                                    onClick={() => { this.sendFileDialog() }}>
                                    <img className="image-button size20margin5" style={{ marginTop: 10, marginBottom: 10 }} src={imgUpload} />
                                </div>

                                <textarea className="chat-input" cols="40" rows="1"
                                    onKeyDown={this.handleKeyPress}
                                    value={this.state.inputMessage}
                                    onChange={(e) => { this.setState({ inputMessage: e.target.value }) }} />

                                <div style={{ float: "left", width: 30, height: 40 }}
                                    onClick={() => { this.sendMessage() }}>
                                    <img className="image-button size20margin5" style={{ marginTop: 10, marginBottom: 10 }} src={imgSend} />
                                </div>
                            </div>
                        </FileDrop>
                        :
                        <React.Fragment>
                            <div>plz select chat</div>
                        </React.Fragment>}
                </div>
            </React.Fragment>
        )
    }
}

ChatPage.propTypes = {
    selectPage: PropTypes.func,
}