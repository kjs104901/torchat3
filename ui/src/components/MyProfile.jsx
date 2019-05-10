import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

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

export default class MyProfile extends Component {
    constructor(props) {
        super(props);
    };

    setClipboard = (address) => {
        remoteControl.setClipboard("tc3:" + address);
        MySwal.fire({
            text: langs.get('PopupClipboard'),
            heightAuto: false,
            width: 400,
        })
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

        return (
            <React.Fragment>
                <div className="myself">
                    <div className="profile__head big">
                        <div className={"profile__head__background big " + myColor}></div>
                        <img className="profile__head__picture big"
                            src={"data:image/svg+xml;base64," + myProfileImage} />
                    </div>
                    <div className="profile__body big">
                        <div className="profile__body__nickname big">{myName}</div>
                        <div className="profile__body__last-message big">{myProfileInfo}</div>
                    </div>
                </div>
                <div className="my-address">
                    <div className="my-address__address draggable">
                        {"tc3:" + myAddress}
                    </div>
                    <div style={{ float: 'left', width: 30, paddingTop: 3 }}
                        onClick={() => { this.setClipboard(myAddress) }}>
                        <img className="image-button size20margin5" src={imgCopy} />
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

MyProfile.propTypes = {
}
