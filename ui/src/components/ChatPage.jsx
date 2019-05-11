import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

import PerfectScrollbar from 'react-perfect-scrollbar'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

import ChatMessagePage from './ChatMessagePage';
import ProfilePage from './ProfilePage';
import MyProfile from './MyProfile';

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

export default class ChatPage extends Component {
    constructor(props) {
        super(props);

        this.scrollReq = false;

        this.state = {
            selectedUser: null,
            showProfile: false,
            inputUserAddress: "",
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

    componentWillUpdate() {
        const targetUserList = userList.getList();
        if (targetUserList.indexOf(this.state.selectedUser) === -1) {
            this.state.selectedUser = null;
        }
    }

    componentDidUpdate() {
        if (this.scrollReq) {
            this.scrollReq = false;

            if (this.chatMessagePageRef) {
                this.chatMessagePageRef.scrollToEnd();
            }
        }
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

    selectUserByAddress = (address) => {
        if (address && address.length > 0) {
            const user = userList.findUser(address);
            if (user) {
                this.selectUser(user, false)
            }
        }
    }

    selectUser = (user, showProfile) => {
        this.setState({ selectedUser: user, showProfile: showProfile })
        this.scrollReq = true;
    }

    turnProfile = (onOff) => {
        this.setState({ showProfile: onOff })
    }

    addFriendInput = () => { remoteControl.addFriend(this.state.inputUserAddress); }

    renderUserList = () => {
        let row = [];

        let targetUserList = userList.getList();
        targetUserList.sort((a, b) => { return userList.compareUser(a, b); });

        targetUserList.forEach((user, index) => {
            if (user.address === remoteControl.getHostname()) { return; }

            let selected = false;
            if (user === this.state.selectedUser) { selected = true; }

            let color = '';
            if (user.socketOutConnected && user.socketInConnected) { color = 'green'; }
            else if (user.socketOutConnected || user.socketInConnected) { color = 'yellow'; }

            let name = remoteControl.getUserName(user.address);

            let lastMessage;
            if (user.lastMessage.length > 0) { lastMessage = user.lastMessage; }

            row.push(
                <div className={selected ? "user selected" : "user"} key={index}
                    onClick={() => { this.selectUser(user, false); }}>
                    <div className="profile__head">
                        <div className={"profile__head__background " + color}></div>
                        <img className="image-button profile__head__picture"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.innerWidth > 500) {
                                    this.selectUser(user, true);
                                }
                                else {
                                    this.selectUser(user, false);
                                }
                            }}
                            src={"data:image/png;base64," + user.profile.image} />
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

    render() {
        return (
            <React.Fragment>
                <div id='side-bar'>
                    <div id='side-menu'>
                        <MyProfile />
                        <div className="clearfix"></div>
                        <div className="menu-select">
                            <div className="menu-select__item selected" onClick={() => { this.props.selectPage(1) }}>
                                {langs.get('MenuChat')}
                            </div>
                            <div className="menu-select__item" onClick={() => { this.props.selectPage(2) }}>
                                {langs.get('MenuSettings')}
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
                        <div id='user-list' >
                            <PerfectScrollbar
                                style={{ width: '100%', height: '100%' }}
                                option={{ suppressScrollX: true }}>
                                {this.renderUserList()}
                            </PerfectScrollbar>
                        </div>
                    </div>
                </div>
                <div id='content'>
                    {this.state.selectedUser ?
                        this.state.showProfile ?
                            <ProfilePage selectedUser={this.state.selectedUser} turnProfile={this.turnProfile} />
                            :
                            <ChatMessagePage
                                ref={(ref) => { this.chatMessagePageRef = ref }}
                                selectedUser={this.state.selectedUser} turnProfile={this.turnProfile} />
                        :
                        <React.Fragment>
                            <div style={{ width: '100%', height: 'calc(50% - 25px)' }}></div>
                            <div style={{ width: '100%', height: 25, textAlign: 'center', fontSize: '20px' }}>
                                {langs.get('BackgroundStartChat')}
                            </div>
                        </React.Fragment>}
                </div>
            </React.Fragment>
        )
    }
}

ChatPage.propTypes = {
    selectPage: PropTypes.func,
}