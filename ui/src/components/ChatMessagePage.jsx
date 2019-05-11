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
import imgInfo from '../assets/info.png'
import imgUpload from '../assets/upload.png'

export default class ChatMessagePage extends Component {
    constructor(props) {
        super(props);

        this.scrollRef = null;
        this.scrollReachEnd = true;

        this.state = {
            inputMessage: "",
        };
    };

    componentDidUpdate() {
        if (this.scrollRef) {
            if (this.scrollReachEnd) {
                this.scrollToEnd();
            }
        }
    }

    scrollToEnd() {
        this.scrollRef.scrollTop = this.scrollRef.scrollHeight;
        this.scrollReachEnd = true;
    }

    sendMessage = () => {
        if (this.props.selectedUser && this.state.inputMessage.length > 0) {
            if (this.state.inputMessage.length > remoteControl.MaxLenChatMessage) {
                this.showError(new Error(langs.get('ErrorChatMessageLength') + ': ' + remoteControl.MaxLenChatMessage));
            }
            else {
                remoteControl.sendMessage(this.props.selectedUser.address, this.state.inputMessage);
                this.setState({
                    inputMessage: ""
                })
            }
        }
    }

    sendFileDialog = () => {
        if (this.props.selectedUser) {
            remoteControl.sendFileDialog(this.props.selectedUser.address);
        }
    }

    sendFile = (path) => {
        if (this.props.selectedUser) {
            remoteControl.sendFile(this.props.selectedUser.address, path)
        }
    }

    addFriend = (targetAddress) => { remoteControl.addFriend(targetAddress); }
    removeFriend = (targetAddress) => {
        MySwal.fire({
            title: langs.get('PopupRemoveFriendTitle'),
            text: langs.get('PopupRemoveFriendText'),
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'okay',
            cancelButtonText: 'cancel',
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result.value) {
                remoteControl.removeFriend(targetAddress);
                MySwal.fire({
                    title: langs.get('PopupRemoveFriendFinishedTitle'),
                    heightAuto: false,
                    width: 400,
                })
            }
        })
    }

    addBlack = (targetAddress) => {
        MySwal.fire({
            title: langs.get('PopupBlockTitle'),
            text: langs.get('PopupBlockText'),
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'okay',
            cancelButtonText: 'cancel',
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result.value) {
                remoteControl.addBlack(targetAddress);
                MySwal.fire({
                    title: langs.get('PopupBlockFinishedTitle'),
                    text: langs.get('PopupBlockFinishedText'),
                    heightAuto: false,
                    width: 400,
                })
            }
        })
    }
    removeBlack = (targetAddress) => { remoteControl.removeBlack(targetAddress); }

    handleKeyPress = (event) => {
        if ((event.keyCode === 10 || event.keyCode === 13)) {
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

    handleDrop = (files, event) => {
        if (files.length > 10) {
            this.showError(new Error(langs.get('ErrorChatFileMax') + ': 10'))
        }
        else {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                this.sendFile(file.path);
            }
        }
    }

    renderAlert = () => {
        if (this.props.selectedUser) {
            const targetUser = this.props.selectedUser;
            if (!remoteControl.isFriend(targetUser.address)) {
                return (
                    <div className="friend-alert">
                        <div className="friend-alert__text">{langs.get('AlertNotFriend')}</div>
                        <div className="friend-alert__button"
                            onClick={() => { this.addBlack(targetUser.address) }}>
                            <img
                                style={{ marginTop: 15 }}
                                className="image-button size20margin5" src={imgBlackWhite} />
                        </div>
                        <div className="friend-alert__button"
                            onClick={() => { this.addFriend(targetUser.address) }}>
                            <img
                                style={{ marginTop: 15 }}
                                className="image-button size20margin5" src={imgAddWhite} />
                        </div>
                    </div>
                )
            }
        }
    }

    renderMessages = () => {
        let row = [];
        if (this.props.selectedUser) {
            this.props.selectedUser.messageList.forEach((message, index) => {
                row.push(
                    <ChatMessage
                        selectedUser={this.props.selectedUser}
                        message={message}
                        key={index} />
                )
            });
        }
        return (
            <div className="message-list-inner">
                <div style={{ height: 100 }}></div>
                <div>{row}</div>
            </div>
        );
    }

    render() {
        // selected
        let selectedUser;
        let selectedAddress = "";
        let selectedProfileImage = "";
        let selectedName = "";

        if (this.props.selectedUser) {
            selectedUser = this.props.selectedUser;
            if (selectedUser) {
                selectedAddress = selectedUser.address;
                selectedName = remoteControl.getUserName(selectedAddress);
                selectedProfileImage = selectedUser.profile.image;
            }
        }

        return (
            <FileDrop onDrop={this.handleDrop}>
                <div id='content__header'>
                    <img id="content__header__picture" className="image-button"
                        onClick={() => { this.props.turnProfile(true) }}
                        src={"data:image/png;base64," + selectedProfileImage} />
                    <div id='content__header__info'>
                        <div id='content__header__info__nickname'>
                            {selectedName}
                        </div>
                        <div id='content__header__info__address' className='draggable'>
                            {"tc3:" + selectedAddress}
                        </div>
                    </div>
                    <div id='content__header__button'
                        onClick={() => { this.props.turnProfile(true) }}>
                        <img className="image-button size30margin10" src={imgInfo} />
                    </div>
                </div>
                {this.renderAlert()}
                <div id='message-list'>
                    <PerfectScrollbar
                        containerRef={(ref) => { this.scrollRef = ref; }}
                        style={{ width: '100%', height: '100%' }}
                        onScrollUp={() => { this.scrollReachEnd = false; }}
                        onYReachEnd={() => { this.scrollReachEnd = true; }}
                        option={{suppressScrollX: true}}>
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
        )
    }
}

ChatMessagePage.propTypes = {
    selectedUser: PropTypes.object,
    turnProfile: PropTypes.func,
}
