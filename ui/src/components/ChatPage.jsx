import React, { Component } from 'react'
import PropTypes from 'prop-types';
import FileDrop from 'react-file-drop';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

import ChatMessage from './ChatMessage';

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
    }

    componentWillUnmount() {
        userList.event.removeListener('updated', this.updateUI);
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
        remoteControl.event.removeListener('chatError', this.showError);
        remoteControl.event.removeListener('contactError', this.showError);
    }

    updateUI = () => {
        this.forceUpdate();
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

    addFriendInput = () => { remoteControl.addFriend(this.state.inputUserAddress); }

    addFriend = (targetAddress) => { remoteControl.addFriend(targetAddress); }
    removeFriend = (targetAddress) => { remoteControl.removeFriend(targetAddress); }
    setNicknameDialog = (targetAddress) => {
        let inputValue = remoteControl.getNickname(targetAddress);
        MySwal.fire({
            title: 'Add nickname test',
            input: 'text',
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
                else {
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
                    <div className="inchat-alert">
                        this is not a friend
                        <div onClick={() => { this.addFriend(targetUser.address) }}>add friend</div>
                        <div onClick={() => { this.addBlack(targetUser.address) }}>add black</div>
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
            let color = 'red';
            if (user.halfConnected) { color = 'orange'; }
            if (user.connected) { color = 'green'; }

            let friendButton = (<span onClick={() => { this.addFriend(user.address); }}>친추</span>);
            if (remoteControl.isFriend(user.address)) {
                friendButton = (<span onClick={() => { this.removeFriend(user.address); }}>친삭</span>);
            }

            let blackButton = (<span onClick={() => { this.addBlack(user.address); }}>차단</span>);
            if (remoteControl.isBlack(user.address)) {
                blackButton = (<span onClick={() => { this.removeBlack(user.address); }}>해제</span>);
            }

            let nickname = remoteControl.getNickname(user.address);

            row.push(
                <div className="user" key={index} style={{ color }}>
                    <img src={"data:image/svg+xml;base64," + user.profile.image} />
                    {friendButton}
                    {blackButton}
                    nick: {nickname}
                    <span
                        onClick={() => { this.setNicknameDialog(user.address) }}>
                        nickset
                    </span>
                    <span
                        onClick={() => { this.setState({ selectedUser: user }) }}>
                        {user.address}
                    </span>
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
        return row;
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
        return (
            <React.Fragment>
                <div id='side-bar'>
                    <div id='side-menu'>
                        <div id='my-name'>my name</div>
                        <div id='my-address'>my address</div>
                        <div id='button-setting'
                            onClick={() => { this.props.selectPage(2) }}>
                            setting
                            </div>
                    </div>
                    <div id='side-content'>
                        <div id='user-list-menu'>
                            <input type="text"
                                value={this.state.inputUserAddress}
                                onChange={(e) => { this.setState({ inputUserAddress: e.target.value }) }} />
                            <div onClick={() => {
                                this.setState({ inputUserAddress: remoteControl.getClipboard() })
                            }}>cilp</div>
                            <div onClick={() => { this.addFriendInput() }}>{langs.get("ButtonAddFriend")}</div>
                        </div>
                        <div id='user-list'>
                            {this.renderUserList()}
                        </div>
                    </div>
                </div>
                <div id='content'>
                    <div id='message-list'>
                        {this.renderAlert()}
                        <FileDrop onDrop={this.handleDrop}>
                            {this.renderMessages()}
                        </FileDrop>
                    </div>
                    <div id='message-input'>
                        <textarea cols="40" rows="1"
                            onKeyDown={this.handleKeyPress}
                            value={this.state.inputMessage}
                            onChange={(e) => { this.setState({ inputMessage: e.target.value }) }} />
                        <span onClick={() => { this.sendMessage() }}>>전송</span>
                        <span onClick={() => { this.sendFileDialog() }}>>파일</span>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

ChatPage.propTypes = {
    selectPage: PropTypes.func,
}