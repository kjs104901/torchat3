import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

import PerfectScrollbar from 'react-perfect-scrollbar'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

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

export default class ProfilePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    };

    setClipboard = (address) => {
        remoteControl.setClipboard("tc3:" + address);
        MySwal.fire({
            text: langs.get('PopupClipboard'),
            heightAuto: false,
            width: 400,
        })
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

    setNicknameDialog = (targetAddress) => {
        let inputValue = remoteControl.getNickname(targetAddress);
        MySwal.fire({
            title: langs.get('PopupSetNickname'),
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

    render() {
        const selectedUser = this.props.selectedUser;
        const selectedAddress = selectedUser.address;
        const selectedProfileName = selectedUser.profile.name;
        const selectedProfileInfo = selectedUser.profile.info;
        const selectedProfileImage = selectedUser.profile.image;
        const selectedNickname = remoteControl.getNickname(selectedAddress);
        const selectedIsFriend = remoteControl.isFriend(selectedAddress);
        const selectedIsBlack = remoteControl.isBlack(selectedAddress);

        return (
            <PerfectScrollbar
                style={{ width: '100%', height: '100%' }}
                option={{suppressScrollX: true}}>

                <div className="profile-header"
                    onClick={() => { this.props.turnProfile(false) }}>
                    <img className="profile-close image-button" src={imgClose} />
                </div>

                <div className="profile-group"
                    style={{ textAlign: "center" }}>
                    <img className="profile-image" src={"data:image/png;base64," + selectedProfileImage} />
                </div>

                <div className="profile-group">
                    <li>Address</li>
                    <div className='profile__text draggable'>{'tc3:' + selectedAddress}</div>
                    <button className="button-custom tor"
                        style={{ float: "right" }}
                        onClick={() => { this.setClipboard(selectedAddress) }}>
                        {langs.get('ButtonCopy')}
                    </button>
                    <div className='clearfix'></div>
                </div>

                <div className="profile-group">
                    <li>Profile name</li>
                    <div className='profile__text draggable'>{selectedProfileName}</div>
                </div>

                <div className="profile-group">
                    <li>Profile message</li>
                    <div className='profile__text draggable'>{selectedProfileInfo}</div>
                </div>

                <div className="profile-group">
                    <li>Nickname</li>
                    <div className='profile__text draggable'>{selectedNickname}</div>
                    <button className="button-custom tor"
                        style={{ float: "right" }}
                        onClick={() => { this.setNicknameDialog(selectedAddress) }}>
                        {langs.get('ButtonSetNickname')}
                    </button>
                    <div className='clearfix'></div>
                </div>

                <div className="profile-group">
                    {selectedIsFriend ?
                        <button className="button-custom cancel"
                            style={{ float: "right" }}
                            onClick={() => { this.removeFriend(selectedAddress) }}>
                            {langs.get('ButtonUnfriend')}
                        </button>
                        :
                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.addFriend(selectedAddress) }}>
                            {langs.get('ButtonFriend')}
                        </button>
                    }

                    {selectedIsBlack ?
                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.removeBlack(selectedAddress) }}>
                            {langs.get('ButtonUnblock')}
                        </button>
                        :
                        <button className="button-custom cancel"
                            style={{ float: "right" }}
                            onClick={() => { this.addBlack(selectedAddress) }}>
                            {langs.get('ButtonBlock')}
                        </button>
                    }
                    <div className='clearfix'></div>
                </div>

                <div className="profile-group"></div>

            </PerfectScrollbar >
        )
    }
}

ProfilePage.propTypes = {
    selectedUser: PropTypes.object,
    turnProfile: PropTypes.func,
}
