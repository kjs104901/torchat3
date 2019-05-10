import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;
const langs = window.langs;

import PerfectScrollbar from 'react-perfect-scrollbar'
import Switch from "react-switch";
import Select from 'react-select';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

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

export default class SettingPage extends Component {
    constructor(props) {
        super(props);

        this.settingValue = remoteControl.getSetting();
        this.state = {
            selectedSetting: 1,
            // 1: MenuMyProfile // 2: MenuGeneral // 3: MenuConnections
            // 4: MenuBlacklist // 5: MenuAppearence // 6: MenuBackup

            inputProfileName: this.settingValue.profileName,
            inputProfileInfo: this.settingValue.profileInfo,

            inputTorrcExpand: this.settingValue.torrcExpand,
            inputUseBridge: this.settingValue.useBridge,
            inputBridge: this.settingValue.bridge,

            inputBlackAddress: "",

            inputNightMode: this.settingValue.nightMode,
            inputLanguage: this.settingValue.language,
        };
    };

    componentDidMount() {
        userList.event.on('updated', this.updateUI);
        remoteControl.event.on('contactUpdate', this.updateUI);
        remoteControl.event.on('contactError', this.showError);
        remoteControl.event.on('contactError', this.showError);
    }

    componentWillUnmount() {
        userList.event.removeListener('updated', this.updateUI);
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
        remoteControl.event.removeListener('contactError', this.showError);
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

    selectSetting = (num) => {
        this.setState({ selectedSetting: num })
    }

    saveProfile = () => {
        if (this.state.inputProfileName.length > remoteControl.MaxLenProfileName) {
            this.showError(new Error("profile name too long"));
        }
        else if ((/^[\x00-\xFF]*$/).test(this.state.inputProfileName) === false) {
            this.showError(new Error("profile name only ascii"));
        }
        else if (this.state.inputProfileInfo.length > remoteControl.MaxLenProfileInfo) {
            this.showError(new Error("profile info too long"));
        }
        else {
            remoteControl.saveProfile(this.state.inputProfileName, this.state.inputProfileInfo);
        }
    }

    saveConnection = () => {
        remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputUseBridge, this.state.inputBridge);
    };

    addBlack = () => {
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
                remoteControl.addBlack(this.state.inputBlackAddress);;
                MySwal.fire({
                    title: langs.get('PopupBlockFinishedTitle'),
                    text: langs.get('PopupBlockFinishedText'),
                    heightAuto: false,
                    width: 400,
                })
            }
        })
    }

    removeBlack = (targetAddress) => {
        remoteControl.removeBlack(targetAddress);
    }

    setNightMode = (value) => {
        remoteControl.setNightMode(value);
    }

    setLanguage = (value) => {
        remoteControl.setLanguage(value);
    }

    renderSetting = () => {
        if (this.state.selectedSetting === 1) { // 1: MenuMyProfile
            return (
                <React.Fragment>
                    <div className="option-group">
                        <li>{langs.get('OptionProfileName')}</li>
                        <input type="text" className="option-control large" required
                            value={this.state.inputProfileName}
                            onChange={(e) => { this.setState({ inputProfileName: e.target.value }) }} />
                    </div>

                    <div className="option-group">
                        <li>{langs.get('OptionProfileMessage')}</li>
                        <textarea
                            className="option-control" id="torrc-expand" cols="40" rows="4" required
                            value={this.state.inputProfileInfo}
                            onChange={(e) => { this.setState({ inputProfileInfo: e.target.value }) }} />
                    </div>

                    <div className="option-group">
                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.saveProfile() }}>
                            {langs.get('ButtonSave')}
                        </button>
                    </div>
                </React.Fragment>
            )
        }
        else if (this.state.selectedSetting === 2) { // 2: MenuGeneral 
            return (
                <React.Fragment>
                </React.Fragment>
            )

        }
        else if (this.state.selectedSetting === 3) { // 3: MenuConnections
            return (
                <React.Fragment>
                    <div className="option-group">
                        <li>{langs.get('OptionTorrcExpand')}</li>
                        <textarea
                            className="option-control" id="torrc-expand" cols="40" rows="4" required
                            value={this.state.inputTorrcExpand}
                            onChange={(e) => { this.setState({ inputTorrcExpand: e.target.value }) }} />
                    </div>

                    <div className="option-group">
                        <li>{langs.get('OptionBridge')}</li>

                        <div style={{ float: 'right' }}>
                            <Switch
                                onChange={(checked) => { this.setState({ inputUseBridge: checked }) }}
                                checked={this.state.inputUseBridge}
                                onColor="#3085d6"
                                onHandleColor="#2b77c0"
                                handleDiameter={13}
                                height={20}
                                width={40}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                activeBoxShadow="0px 0px 0px 0px rgba(0, 0, 0, 0)"
                                className="react-switch" />
                        </div>

                        <input type="text" className="option-control large" required
                            value={this.state.inputBridge}
                            onChange={(e) => { this.setState({ inputBridge: e.target.value }) }} />
                    </div>

                    <div className="option-group">
                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.saveConnection() }}>
                            {langs.get('ButtonSave')}
                        </button>
                    </div>
                </React.Fragment>
            )

        }
        else if (this.state.selectedSetting === 4) { // 4: MenuBlacklist 

            let low = [];

            remoteControl.getBlackList().forEach((black, index) => {
                low.push(
                    <React.Fragment key={index}>
                        <div className="black-item">
                            <div className="black-item-address draggable"> {"tc3:" + black} </div>

                            <button className="button-custom cancel"
                                style={{ float: "right", marginTop: 15 }}
                                onClick={() => { this.removeBlack(black) }}>
                                {langs.get('ButtonRemove')}
                            </button>
                        </div>
                        <div className="clearfix"></div>
                    </React.Fragment>
                )
            });

            return (
                <React.Fragment>
                    <div className="option-group">
                        <li>{langs.get('OptionBlackList')}</li>
                        <input type="text" className="option-control large" required
                            style={{ width: 'calc(100% - 130px)' }}
                            value={this.state.inputBlackAddress}
                            onChange={(e) => { this.setState({ inputBlackAddress: e.target.value }) }} />

                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.addBlack() }}>
                            {langs.get('ButtonAdd')}
                        </button>
                    </div>

                    <PerfectScrollbar
                        style={{ width: '100%', height: 'calc(100% - 70px)' }}
                        option={{ suppressScrollX: true }}>

                        <div className="option-group" style={{ paddingBottom: 50 }}>
                            {low}
                        </div>
                    </PerfectScrollbar>
                </React.Fragment>
            )
        }
        else if (this.state.selectedSetting === 5) { // 5: MenuAppearence
            return (
                <React.Fragment>
                    <div className="option-group">
                        <li>{langs.get('OptionTheme')}</li>
                        <div className="option-group">
                            <Select
                                value={{
                                    value: this.state.inputNightMode,
                                    label: (this.state.inputNightMode ? 'Night Mode' : 'Day Mode')
                                }}
                                options={[
                                    { value: true, label: 'Night Mode' },
                                    { value: false, label: 'Day Mode' },
                                ]}
                                onChange={(option) => {
                                    this.setState({ inputNightMode: option.value });
                                    this.setNightMode(option.value);
                                }}
                            />
                        </div>
                    </div>
                    <div className="option-group">
                        <li>{langs.get('OptionLanguage')}</li>
                        <div className="option-group">
                            <Select
                                value={{
                                    value: this.state.inputLanguage,
                                    label: this.state.inputLanguage
                                }}
                                options={[
                                    { value: 'English', label: 'English' },
                                    { value: 'Korean', label: 'Korean' },
                                ]}
                                onChange={(option) => {
                                    this.setState({ inputLanguage: option.value });
                                    this.setLanguage(option.value);
                                }}
                            />
                        </div>
                    </div>
                </React.Fragment>
            )
        }
        else if (this.state.selectedSetting === 6) { // 6: MenuBackup
        }
    }

    render() {
        // myself
        let myAddress = remoteControl.getHostname();

        let myName = "";
        const myProfileName = remoteControl.getSetting().profileName;
        if (myProfileName) { myName = myProfileName; }
        if (myName.length === 0) { myName = "tc3:" + myAddress }

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
                <div id='side-bar'>
                    <div id='side-menu'>
                        <MyProfile />
                        <div className="clearfix"></div>
                        <div className="menu-select">
                            <div className="menu-select__item" onClick={() => { this.props.selectPage(1) }}>
                                {langs.get('MenuChat')}
                            </div>
                            <div className="menu-select__item selected" onClick={() => { this.props.selectPage(2) }}>
                                {langs.get('MenuSettings')}
                            </div>
                        </div>
                    </div>
                    <div id='side-content'>
                        <PerfectScrollbar
                            style={{ width: '100%', height: '100%' }}
                            option={{ suppressScrollX: true }}>

                            <div className={"option-list__option" + (this.state.selectedSetting === 1 ? " selected" : "")}
                                onClick={() => { this.selectSetting(1) }}>
                                <div className="option-name">{langs.get('MenuMyProfile')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 2 ? " selected" : "")}
                                onClick={() => { this.selectSetting(2) }}>
                                <div className="option-name">{langs.get('MenuGeneral')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 3 ? " selected" : "")}
                                onClick={() => { this.selectSetting(3) }}>
                                <div className="option-name">{langs.get('MenuConnections')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 4 ? " selected" : "")}
                                onClick={() => { this.selectSetting(4) }}>
                                <div className="option-name">{langs.get('MenuBlacklist')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 5 ? " selected" : "")}
                                onClick={() => { this.selectSetting(5) }}>
                                <div className="option-name">{langs.get('MenuAppearence')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 6 ? " selected" : "")}
                                onClick={() => { this.selectSetting(6) }}>
                                <div className="option-name">{langs.get('MenuBackup')}</div>
                            </div>
                        </PerfectScrollbar>
                    </div>
                </div>
                <div id='content'>
                    {this.renderSetting()}
                </div>
            </React.Fragment>
        )
    }
}

SettingPage.propTypes = {
    selectPage: PropTypes.func,
}