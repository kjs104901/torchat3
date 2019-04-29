import React, { Component } from 'react'
import PropTypes from 'prop-types';

import userList from '../userList';

import remoteControl from '../remoteControl';

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
    }

    componentWillUnmount() {
        remoteControl.event.removeListener('contactUpdate', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    selectSetting = (num) => {
        this.setState({ selectedSetting: num })
    }

    saveProfile = () => {
        remoteControl.saveProfile(this.state.inputProfileName, this.state.inputProfileInfo);
    }

    saveConnection = () => {
        remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputBridge);
    };

    addBlack = () => {
        remoteControl.addBlack(this.state.inputBlackAddress);
    }

    removeBlack = (targetAddress) => {
        remoteControl.removeBlack(this.state.inputBlackAddress);
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

            userList.getBlackList().forEach((black, index) => {
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
                        <div onClick={() => { this.switchNightMode() }}>{this.settingValue.nigthMode ? "nightmode" : "daymode"}</div>
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