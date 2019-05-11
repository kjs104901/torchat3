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
            // 4: MenuBlockedlist // 5: MenuAppearence // 6: MenuBackup
            // 7: License

            inputProfileName: this.settingValue.profileName,
            inputProfileInfo: this.settingValue.profileInfo,

            inputTorrcExpand: this.settingValue.torrcExpand,
            inputUseBridge: this.settingValue.useBridge,
            inputBridge: this.settingValue.bridge,

            inputBlackAddress: "",

            inputNightMode: this.settingValue.nightMode,
            inputLanguage: this.settingValue.language,

            inputMinimizeToTray: this.settingValue.minimizeToTray,
            inputNotification: this.settingValue.notification,
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
            this.showError(new Error(langs.get('ErrorProfileNameTooLong')));
        }
        else if ((/^[\x00-\xFF]*$/).test(this.state.inputProfileName) === false) {
            this.showError(new Error(langs.get('ErrorProfileNameOnlyAscii')));
        }
        else if (this.state.inputProfileInfo.length > remoteControl.MaxLenProfileInfo) {
            this.showError(new Error(langs.get('ErrorProfileInfoTooLong')));
        }
        else {
            remoteControl.saveProfile(this.state.inputProfileName, this.state.inputProfileInfo);
        }
    }

    saveConnection = () => {
        MySwal.fire({
            title: langs.get('PopupConnectionAlertTitle'),
            text: langs.get('PopupConnectionAlertText'),
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'okay',
            cancelButtonText: 'cancel',
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result.value) {
                remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputUseBridge, this.state.inputBridge);
            }
        })
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

    exportKeyBackup = () => {
        remoteControl.exportKeyBackup();
    }

    importKeyBackup = () => {
        MySwal.fire({
            title: langs.get('PopupImportKeyTitle'),
            text: langs.get('PopupExportKeyText'),
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'okay',
            cancelButtonText: 'cancel',
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result.value) {
                remoteControl.importKeyBackup();
            }
        })
    }

    exportContactsBackup = () => {
        remoteControl.exportContactsBackup();
    }

    importContactsBackup = () => {
        MySwal.fire({
            title: langs.get('PopupImportContactsTitle'),
            text: langs.get('PopupImportContactsText'),
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'okay',
            cancelButtonText: 'cancel',
            heightAuto: false,
            width: 400,
        }).then((result) => {
            if (result.value) {
                remoteControl.importContactsBackup();
            }
        })
    }


    logsRender = () => {
        let low = [];
        const bootLogs = remoteControl.getBootLogs();
        bootLogs.forEach((log, index) => {
            low.unshift(
                <React.Fragment key={index}>
                    <div> {log} </div>
                    <br />
                </React.Fragment>
            )
        });
        return low;
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
                    <div className="option-group">
                        <li>{langs.get('OptionMinimizeToTray')}</li>
                        <div style={{ float: 'right' }}>
                            <Switch
                                onChange={(checked) => {
                                    this.setState({ inputMinimizeToTray: checked });
                                    remoteControl.setMinimizeToTray(checked);
                                }}
                                checked={this.state.inputMinimizeToTray}
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
                    </div>
                    <div className="clearfix"></div>
                    <div className="option-group">
                        <li>{langs.get('OptionNotification')}</li>
                        <div style={{ float: 'right' }}>
                            <Switch
                                onChange={(checked) => {
                                    this.setState({ inputNotification: checked });
                                    remoteControl.setNotification(checked);
                                }}
                                checked={this.state.inputNotification}
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
                    </div>
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
                    <div className="clearfix"></div>

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
                    <div className="clearfix"></div>

                    <div className="option-group">
                        <button className="button-custom confirm"
                            style={{ float: "right" }}
                            onClick={() => { this.saveConnection() }}>
                            {langs.get('ButtonSave')}
                        </button>
                    </div>

                    <div className="clearfix"></div>
                    <div className="option-group">
                        <li>{langs.get('OptionTorLogs')}</li>

                        <PerfectScrollbar
                            style={{ width: "100%", height: 200, marginTop: 20, fontSize: 12, overflow: 'auto' }}
                            option={{ suppressScrollX: true }}>
                            {this.logsRender()}
                        </PerfectScrollbar>
                    </div>
                </React.Fragment>
            )

        }
        else if (this.state.selectedSetting === 4) { // 4: MenuBlockedlist 

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
                        <li>{langs.get('OptionBlockedList')}</li>
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
                        <div className="option-group"
                            style={{ color: 'black' }}>
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
                        <div className="option-group"
                            style={{ color: 'black' }}>
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
            return (
                <React.Fragment>
                    <div className="option-group">
                        <li>{langs.get('OptionKeyBackup')}</li>
                        <div>{langs.get('OptionKeyBackupRestart')}</div>
                        <div>{langs.get('OptionKeyBackupAlert')}</div>
                        <div className="clearfix"></div>
                        <button className="button-custom tor"
                            style={{ float: "right" }}
                            onClick={() => { this.exportKeyBackup() }}>
                            {langs.get('ButtonExport')}
                        </button>
                        <button className="button-custom cancel"
                            style={{ float: "right" }}
                            onClick={() => { this.importKeyBackup() }}>
                            {langs.get('ButtonImport')}
                        </button>
                    </div>
                    <div className="clearfix"></div>

                    <div className="option-group">
                        <li>{langs.get('OptionContactsBackup')}</li>
                        <button className="button-custom tor"
                            style={{ float: "right" }}
                            onClick={() => { this.exportContactsBackup() }}>
                            {langs.get('ButtonExport')}
                        </button>
                        <button className="button-custom cancel"
                            style={{ float: "right" }}
                            onClick={() => { this.importContactsBackup() }}>
                            {langs.get('ButtonImport')}
                        </button>
                    </div>
                    <div className="clearfix"></div>

                </React.Fragment>
            )

        }
        else if (this.state.selectedSetting === 7) { // 7: MenuLicense
            return (
                <React.Fragment>
                    <PerfectScrollbar
                        style={{ width: '100%', height: '100%' }}
                        option={{ suppressScrollX: true }}>

                        <div className="option-group">
                            <li>base32.js</li>
                            <div>[MIT] https://github.com/speakeasyjs/base32.js</div>
                        </div>
                        <div className="option-group">
                            <li>csv-parse</li>
                            <div>[MIT] https://github.com/adaltas/node-csv-parse</div>
                        </div>
                        <div className="option-group">
                            <li>identicon.js</li>
                            <div>[BSD 2-Clause] https://github.com/stewartlord/identicon.js</div>
                        </div>
                        <div className="option-group">
                            <li>lowdb</li>
                            <div>[MIT] https://github.com/typicode/lowdb</div>
                        </div>
                        <div className="option-group">
                            <li>node-notifier</li>
                            <div>[MIT] https://github.com/mikaelbr/node-notifier</div>
                        </div>
                        <div className="option-group">
                            <li>rc-progress</li>
                            <div>[MIT] https://github.com/react-component/progress</div>
                        </div>
                        <div className="option-group">
                            <li>react</li>
                            <div>[MIT] https://github.com/facebook/react</div>
                        </div>
                        <div className="option-group">
                            <li>react-collapsible</li>
                            <div>[MIT] https://github.com/glennflanagan/react-collapsible</div>
                        </div>
                        <div className="option-group">
                            <li>react-perfect-scrollbar</li>
                            <div>[MIT] https://github.com/goldenyz/react-perfect-scrollbar</div>
                        </div>
                        <div className="option-group">
                            <li>react-select</li>
                            <div>[MIT] https://github.com/JedWatson/react-select</div>
                        </div>
                        <div className="option-group">
                            <li>react-switch</li>
                            <div>[MIT] https://github.com/markusenglund/react-switch</div>
                        </div>
                        <div className="option-group">
                            <li>sha3</li>
                            <div>[MIT] https://github.com/phusion/node-sha3</div>
                        </div>
                        <div className="option-group">
                            <li>socks</li>
                            <div>[MIT] https://github.com/JoshGlazebrook/socks</div>
                        </div>
                        <div className="option-group">
                            <li>supercop.js</li>
                            <div>https://github.com/1p6/supercop.js</div>
                        </div>
                        <div className="option-group" style={{ paddingBottom: 50 }}>
                            <li>sweetalert2</li>
                            <div>[MIT] https://github.com/sweetalert2/sweetalert2</div>
                        </div>
                    </PerfectScrollbar>
                </React.Fragment>
            )
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
                                <div className="option-name">{langs.get('MenuBlockedList')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 5 ? " selected" : "")}
                                onClick={() => { this.selectSetting(5) }}>
                                <div className="option-name">{langs.get('MenuAppearence')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 6 ? " selected" : "")}
                                onClick={() => { this.selectSetting(6) }}>
                                <div className="option-name">{langs.get('MenuBackup')}</div>
                            </div>
                            <div className={"option-list__option" + (this.state.selectedSetting === 7 ? " selected" : "")}
                                onClick={() => { this.selectSetting(7) }}>
                                <div className="option-name">{langs.get('MenuLicense')}</div>
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