import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default class SettingPage extends Component {
    constructor(props) {
        super(props);

        this.settingValue = remoteControl.getSetting();
        //test
        console.log("settingValue1", remoteControl.getSetting());
        this.state = {
            selectedSetting: 1, // 1: user profile // 2: connection // 3: blackList // 4: appearence

            inputProfileName: this.settingValue.profileName,
            inputProfileInfo: this.settingValue.profileInfo,

            inputTorrcExpand: this.settingValue.torrcExpand,
            inputUseBridge: this.settingValue.useBridge,
            inputBridge: this.settingValue.bridge,

            inputBlackAddress: "",

            inputNigthMode: this.settingValue.nigthMode
        };
    };

    componentDidMount() {
        remoteControl.event.on('contactUpdate', this.updateUI);
        remoteControl.event.on('contactError', this.showError);
    }

    componentWillUnmount() {
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
        remoteControl.event.removeListener('contactError', this.showError);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    showError = (err) => {
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

    selectSetting = (num) => {
        this.setState({ selectedSetting: num })
    }

    saveProfile = () => {
        if (this.state.inputProfileName > remoteControl.MaxLenProfileName) {
            this.showError(new Error("profile name too long"));
        }
        else if (this.state.inputProfileInfo > remoteControl.MaxLenProfileInfo) {
            this.showError(new Error("profile info too long"));
        }
        else {
            remoteControl.saveProfile(this.state.inputProfileName, this.state.inputProfileInfo);
        }
    }

    saveConnection = () => {
        remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputBridge);
    };

    addBlack = () => {
        remoteControl.addBlack(this.state.inputBlackAddress);
    }

    removeBlack = (targetAddress) => {
        remoteControl.removeBlack(targetAddress);
    }

    switchNightMode = () => {
        remoteControl.switchNightMode();
    }

    renderSetting = () => {
        if (this.state.selectedSetting == 1) {
            return (
                <React.Fragment>
                    <input type="text"
                        value={this.state.inputProfileName}
                        onChange={(e) => { this.setState({ inputProfileName: e.target.value }) }} />
                    <input type="text"
                        value={this.state.inputProfileInfo}
                        onChange={(e) => { this.setState({ inputProfileInfo: e.target.value }) }} />
                    <div onClick={() => { this.saveProfile() }}>저장</div>
                </React.Fragment>)
        }
        else if (this.state.selectedSetting == 2) {
            return (
                <React.Fragment>
                    <input type="text"
                        value={this.state.inputTorrcExpand}
                        onChange={(e) => { this.setState({ inputTorrcExpand: e.target.value }) }} />

                    <input type="text"
                        value={this.state.inputBridge}
                        onChange={(e) => { this.setState({ inputBridge: e.target.value }) }} />
                    <div onClick={() => { this.saveConnection() }}>저장</div>
                </React.Fragment>)

        }
        else if (this.state.selectedSetting == 3) {
            let low = [];

            remoteControl.getBlackList().forEach((black, index) => {
                low.push(
                    <div className="black" key={index}>
                        {black}
                        <span onClick={() => { this.removeBlack(black) }}>블랙 취소</span>
                    </div>
                )
            });

            return (
                <React.Fragment>
                    <input type="text"
                        value={this.state.inputBlackAddress}
                        onChange={(e) => { this.setState({ inputBlackAddress: e.target.value }) }} />
                    <div onClick={() => { this.addBlack() }}>추가</div>
                    {low}
                </React.Fragment>)

        }
        else if (this.state.selectedSetting == 4) {
            return (
                <React.Fragment>
                    <div onClick={() => { this.switchNightMode() }}>
                        {this.settingValue.nigthMode ? "nightmode" : "daymode"}
                    </div>  
                </React.Fragment>)

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
                            onClick={() => { this.props.selectPage(1) }}>
                            setting
                            </div>
                    </div>
                    <div id='side-content'>
                        <div onClick={() => { this.selectSetting(1) }}>user profile</div>
                        <div onClick={() => { this.selectSetting(2) }}>connection</div>
                        <div onClick={() => { this.selectSetting(3) }}>blackList</div>
                        <div onClick={() => { this.selectSetting(4) }}>appearence</div>
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