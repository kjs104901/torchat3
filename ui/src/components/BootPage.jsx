import React, { Component } from 'react'
import PropTypes from 'prop-types';

// react components
import { Line } from 'rc-progress';
import Collapsible from 'react-collapsible';
import PerfectScrollbar from 'react-perfect-scrollbar'
import Switch from "react-switch";

// modules
const remoteControl = window.remoteControl;
const langs = window.langs;

// files
import logo from '../assets/logo.png'

export default class BootPage extends Component {
    constructor(props) {
        super(props);

        let settingValue = remoteControl.getSetting();
        this.state = {
            inputTorrcExpand: settingValue.torrcExpand,
            inputUseBridge: settingValue.useBridge,
            inputBridge: settingValue.bridge,
        };
    };

    saveConnection = () => {
        remoteControl.saveConnection(this.state.inputTorrcExpand, this.state.inputUseBridge, this.state.inputBridge)
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

    render() {
        return (
            <React.Fragment>
                <div className="centered" style={{ width: "80%", paddingTop: "10vh" }}>
                    <img className='centered' src={logo} style={{ width: "30%", maxWidth: 150 }} />
                    <h1>Torchat3</h1>
                    <Line percent={remoteControl.getProgress()} strokeWidth="2" strokeColor="#5C3E73" style={{ width: "80%", maxWidth: 360, height: 10 }} /><br />
                    {remoteControl.getProgress()}%<br /><br />

                    <Collapsible
                        style={{ width: '100%', height: '100%', backgroundColor: "#eee" }}
                        trigger={<button className="button-custom tor">{langs.get("ButtonTorConf")}</button>} transitionTime={100}>
                        <div className="form-group">
                            <textarea className="form-control" id="torrc-expand" cols="40" rows="4" required
                                value={this.state.inputTorrcExpand}
                                onChange={(e) => { this.setState({ inputTorrcExpand: e.target.value }) }} />
                            <label className="form-control-placeholder" htmlFor="torrc-expand">{langs.get("ConfTorrcExpand")}</label>
                        </div>
                        <div className="form-group">
                            <input type="text" id="bridge" className="form-control" required
                                value={this.state.inputBridge}
                                onChange={(e) => { this.setState({ inputBridge: e.target.value }) }} />
                            <label className="form-control-placeholder" htmlFor="bridge">{langs.get("ConfBridge")}</label>
                            <div style={{ position: 'absolute', top: 9, right: -50 }}>
                                <Switch
                                    onChange={(checked) => { this.setState({ inputUseBridge: checked }) }}
                                    checked={this.state.inputUseBridge}
                                    onColor="#735A93"
                                    onHandleColor="#5C3E73"
                                    handleDiameter={13}
                                    height={20}
                                    width={40}
                                    uncheckedIcon={false}
                                    checkedIcon={false}
                                    activeBoxShadow="0px 0px 0px 0px rgba(0, 0, 0, 0)"
                                    className="react-switch"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <button onClick={() => { this.saveConnection() }} className="button-custom confirm">{langs.get('ButtonSave')}</button>
                        </div>
                    </Collapsible>
                    <div className='centered' style={{ width: "80%" }}>
                        <PerfectScrollbar style={{ width: "100%", height: 200, marginTop: 20, fontSize: 12, overflow: 'auto' }}>
                            {this.logsRender()}
                        </PerfectScrollbar>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

BootPage.propTypes = {
}