import React, { Component } from 'react'
import PropTypes from 'prop-types';

import remoteControl from '../remoteControl';

export default class BootPage extends Component {
    constructor(props) {
        super(props);

        let settingValue = remoteControl.getSetting();
        //test
        console.log("getVa1", remoteControl.getSetting());

        this.state = {
            inputTorrcExpand: settingValue.torrcExpand,
            inputUseBridge: settingValue.useBridge,
            inputBridge: settingValue.bridge,
        };
    };

    saveConnection = () => {
        remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputBridge)
    }

    render() {
        return (
            <React.Fragment>
                <h1>Hello Tor!</h1>
                tor status: {remoteControl.getProgress()}<br />
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