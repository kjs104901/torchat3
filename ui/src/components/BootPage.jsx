import React, { Component } from 'react'
import PropTypes from 'prop-types';

// react components
import { Line } from 'rc-progress';
import Collapsible from 'react-collapsible';
import PerfectScrollbar from 'react-perfect-scrollbar'
import Switch from 'rc-switch';

// modules
const remoteControl = window.remoteControl;
const langs = window.langs;

// files
import logo from '../assets/logo.png'

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

    logsRender = () => {
        let low = [];
        const bootLogs = remoteControl.getBootLogs();
        bootLogs.forEach((log, index) => {
            low.unshift(
                <React.Fragment  key={index}>
                    <div> {log} </div>
                    <br />
                </React.Fragment>
            )
        });
        return low;
    }

    render() {
        return (
            <React.Fragment>
                <div className="centered" style={{ paddingTop: 80 }}>
                    <img className='centered' src={logo} style={{ width: 200, height: 200 }} />
                    <h1>Torchat3</h1>
                    <Line percent={remoteControl.getProgress()} strokeWidth="2" strokeColor="#5C3E73" style={{ width: 400 }} /><br />
                    {remoteControl.getProgress()}%<br /><br />
                    <Collapsible trigger={langs.get("ButtonTorConf")} transitionTime={100}>
                        <input type="text"
                            value={this.state.inputTorrcExpand}
                            onChange={(e) => { this.setState({ inputTorrcExpand: e.target.value }) }} />

                        <input type="text"
                            value={this.state.inputBridge}
                            onChange={(e) => { this.setState({ inputBridge: e.target.value }) }} />

                        <div onClick={() => { this.saveConnection() }}>저장</div>
                    </Collapsible>
                    <PerfectScrollbar style={{ width: 600, height: 200, marginTop: 20, fontSize: 12, overflow: 'auto' }}>
                        {this.logsRender()}
                    </PerfectScrollbar>
                </div>
            </React.Fragment>
        )
    }
}

BootPage.propTypes = {
}