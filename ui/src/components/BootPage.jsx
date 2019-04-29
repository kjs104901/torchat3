import React, { Component } from 'react'
import PropTypes from 'prop-types';

import setting from '../setting';
import boot from '../boot';

export default class BootPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputTorrcExpand: "",
            inputUseBridge: false,
            inputBridge: "",
        };
    };

    componentDidMount() {
        boot.event.on('updated', this.updateUI);
    }

    componentWillUnmount() {
        boot.event.removeListener('updated', this.updateUI);
    }

    updateUI = () => {
        let settingValue = setting.getValue();
        this.setState({
            inputTorrcExpand: settingValue.torrcExpand,
            inputUseBridge: settingValue.useBridge,
            inputBridge: settingValue.bridge,
        })
    }

    saveConnection = () => {
        let settingValue = setting.getValue();
        console.log("getVa", settingValue);
        settingValue.torrcExpand = this.state.inputTorrcExpand;
        settingValue.bridge = this.state.inputBridge;
        //test
        console.log("settingValue", settingValue);
        setting.setValue(settingValue);
        setting.save();
    }

    render() {
        let bootInfo = boot.getBootInformation();

        return (
            <React.Fragment>
                <h1>Hello Tor!</h1>
                tor status: {bootInfo.progress}<br />
                <br />
                <input type="text"
                    value={this.state.inputTorrcExpand}
                    onChange={(e) => { this.setState({ inputTorrcExpand: e.target.value }) }} />

                <input type="text"
                    value={this.state.inputBridge}
                    onChange={(e) => { this.setState({ inputBridge: e.target.value }) }} />

                <div onClick={() => { this.saveConnection() }}>저장</div>
            </React.Fragment>
        )
    }
}

BootPage.propTypes = {
}