import React, { Component } from 'react'
import PropTypes from 'prop-types';

import { remote, ipcRenderer } from 'electron';
import userList from '../userList';
import { use } from 'builder-util';

import ChatMessage from './ChatMessage';

export default class ChatPage extends Component {
    constructor(props) {
        super(props);

        userList.event.on('updateUI', () => { this.forceUpdate(); });

        this.state = {
            selectedUser: null,
            inputUserAddress: "",
            inputMessage: "",
        };
    };

    addFriend = () => {
        ipcRenderer.send('addFriend', { address: this.state.inputUserAddress })
    }

    sendMessage = () => {
        if (this.state.selectedUser && this.state.inputMessage.length > 0) {
            ipcRenderer.send('sendMessage', {
                address: this.state.selectedUser.address,
                message: this.state.inputMessage
            })
            this.setState({
                inputMessage: ""
            })
        }
    }

    sendFile = () => {
        if (this.state.selectedUser) {
            ipcRenderer.send('sendFile', { address: this.state.selectedUser.address })
        }
    }

    renderUserList = () => {
        let row = [];
        userList.getList().forEach((user, index) => {
            row.push(
                <div className="user" key={index} onClick={() => { this.setState({ selectedUser: user }) }}>
                    {user.address}
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

    render() {
        return (
            <React.Fragment>
                <div id='side-bar'>
                    <div id='side-menu'>
                        <div id='my-name'>my name</div>
                        <div id='my-address'>my address</div>
                        <div id='button-setting'>setting</div>
                    </div>
                    <div id='side-content'>
                        <div id='user-list-menu'>
                            <input type="text"
                                value={this.state.inputUserAddress}
                                onChange={(e) => { this.setState({ inputUserAddress: e.target.value }) }} />
                            <div onClick={() => { this.addFriend() }}>새 유저 추가</div>
                        </div>
                        <div id='user-list'>
                            {this.renderUserList()}
                        </div>
                    </div>
                </div>
                <div id='content'>
                    <div id='message-list'>
                        {this.renderMessages()}
                    </div>
                    <div id='message-input'>
                        <input type="text"
                            value={this.state.inputMessage}
                            onChange={(e) => { this.setState({ inputMessage: e.target.value }) }} />
                        <span onClick={() => { this.sendMessage() }}>>전송</span>
                        <span onClick={() => { this.sendFile() }}>>파일</span>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

ChatPage.propTypes = {
}