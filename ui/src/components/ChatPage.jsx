import React, { Component } from 'react'
import PropTypes from 'prop-types';
import FileDrop from 'react-file-drop';

import userList from '../userList';
import remoteControl from '../remoteControl';

import ChatMessage from './ChatMessage';

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
    }

    componentWillUnmount() {
        userList.event.removeListener('updated', this.updateUI);
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    addFriendInput = () => { remoteControl.addFriend(this.state.inputUserAddress); }

    addFriend = (targetAddress) => { remoteControl.addFriend(targetAddress); }
    removeFriend = (targetAddress) => { remoteControl.removeFriend(targetAddress); }
    addBlack = (targetAddress) => { remoteControl.addBlack(targetAddress); }
    removeBlack = (targetAddress) => { remoteControl.removeBlack(targetAddress); }

    sendMessage = () => {
        if (this.state.selectedUser && this.state.inputMessage.length > 0) {
            remoteControl.sendMessage(this.state.selectedUser.address, this.state.inputMessage);
            this.setState({
                inputMessage: ""
            })
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

    renderUserList = () => {
        let row = [];

        let targetUserList = userList.getList();
        targetUserList.sort((a, b) => { return userList.compareUser(a, b); });

        targetUserList.forEach((user, index) => {
            let color = 'red';
            if (user.connected) {
                color = 'green';
            }

            let friendButton = (<span onClick={() => { this.addFriend(user.address); }}>친추</span>);
            if (remoteControl.isFriend(user.address)) {
                friendButton = (<span onClick={() => { this.removeFriend(user.address); }}>친삭</span>);
            }

            let blackButton = (<span onClick={() => { this.addBlack(user.address); }}>차단</span>);
            if (remoteControl.isBlack(user.address)) {
                blackButton = (<span onClick={() => { this.removeBlack(user.address); }}>해제</span>);
            }
            row.push(
                <div className="user" key={index} style={{ color }}>
                    <img src={"data:image/svg+xml;base64," + user.profile.image} />
                    {friendButton}
                    {blackButton}
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
        console.log()
        if (files.length > 10) {
            //TODO 10개 이상 안된다는 메시지 띄우기
        }
        else {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                this.sendFile(file.path);
            }
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
                            <div onClick={() => { this.addFriendInput() }}>새 유저 추가</div>
                        </div>
                        <div id='user-list'>
                            {this.renderUserList()}
                        </div>
                    </div>
                </div>
                <div id='content'>
                    <FileDrop onDrop={this.handleDrop}>
                        <div id='message-list'>
                            {this.renderMessages()}
                        </div>
                    </FileDrop>
                    <div id='message-input'>
                        <input type="text"
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