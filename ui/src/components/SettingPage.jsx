import React, { Component } from 'react'
import PropTypes from 'prop-types';

import setting from '../setting';
import userList from '../userList';

export default class SettingPage extends Component {
    constructor(props) {
        super(props);

        this.settingValue = setting.getValue();
        //test
        console.log("settingValue", this.settingValue);
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
        userList.event.on('updateUI', this.updateUI);
    }

    componentWillUnmount() {
        userList.event.removeListener('updateUI', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    selectSetting = (num) => {
        this.setState({ selectedSetting: num })
    }

    saveProfile = () => {
        this.settingValue.profileName = this.state.inputProfileName;
        this.settingValue.profileInfo = this.state.inputProfileInfo;
        setting.setValue(this.settingValue);
        setting.save();
    }

    saveConnection = () => {
        this.settingValue.torrcExpand = this.state.inputTorrcExpand;
        this.settingValue.bridge = this.state.inputBridge;
        setting.setValue(this.settingValue);
        setting.save();
    }

    addBlack = () => {
        userList.addBlack(this.state.inputBlackAddress);
    }

    removeBlack = (targetAddress) => {
        userList.removeBlack(targetAddress);
    }

    switchNightMode = () => {
        this.settingValue.nigthMode = !this.settingValue.nigthMode;
        //test
        console.log(this.settingValue.nigthMode)
        setting.setValue(this.settingValue);
        setting.save();
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