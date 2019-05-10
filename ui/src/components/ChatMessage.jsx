import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;

import { Line } from 'rc-progress';

import imgUpload from '../assets/upload.png'
import imgDownload from '../assets/download.png'

export default class ChatMessage extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    };

    componentDidMount() {
        userList.event.on('updateFile', this.updateFileUI)
    }

    componentWillUnmount() {
        userList.event.removeListener('updateFile', this.updateFileUI)
    }

    updateFileUI = (address) => {
        if (address == this.props.selectedUser.address) {
            this.forceUpdate();
        }
    }

    acceptFile = (fileID) => {
        remoteControl.acceptFile(this.props.selectedUser.address, fileID);
    }

    cancelFile = (fileID) => {
        remoteControl.cancelFile(this.props.selectedUser.address, fileID);
    }

    saveFile = (fileID, fileName) => {
        remoteControl.saveFile(this.props.selectedUser.address, fileID, fileName);
    }

    renderMessage(message) {
        let lows = [];
        const messageList = message.split('\n');

        //test
        messageList.forEach((message, index) => {
            lows.push(
                <React.Fragment key={index}>
                    {message}<br />
                </React.Fragment>
            )
        })
        return lows;
    }

    render() {
        const message = this.props.message.message;
        const options = this.props.message.options;
        const percent = Math.floor(options.accumSize / options.fileSize * 1000) / 10;

        let fileSizeStr = "";
        if (options.fileSize > 1024 * 1024) { fileSizeStr = Math.floor(options.fileSize / 1024 / 1024) + " MB" }
        else if (options.fileSize > 1024) { fileSizeStr = Math.floor(options.fileSize / 1024) + " KB" }
        else { fileSizeStr = Math.floor(options.fileSize) + " B" }

        let speedStr = "";
        if (options.speed > 1024 * 1024) { speedStr = Math.floor(options.speed / 1024 / 1024) + " MB/s" }
        else if (options.speed > 1024) { speedStr = Math.floor(options.speed / 1024) + " KB/s" }
        else { speedStr = Math.floor(options.speed) + " B/s" }

        const accumSize = Math.floor(options.accumSize / 1024);
        const fileSize = Math.floor(options.fileSize / 1024);

        const buttonList = [];

        if (!options.canceled) {
            if (!options.fromSelf) {
                if (!options.accepted) { // accept button
                    buttonList.push(
                        <div className="message__button" key={1}>
                            <button className="button-custom confirm"
                                onClick={() => { this.acceptFile(options.fileID) }}>
                                {langs.get('ButtonAcceptFile')}
                            </button>
                        </div>
                    )

                }
                if (options.finished) {// save button
                    buttonList.push(
                        <div className="message__button" key={2}>
                            <button className="button-custom confirm"
                                onClick={() => { this.saveFile(options.fileID, message) }}>
                                {langs.get('ButtonSaveFile')}
                            </button>
                        </div>
                    )
                }
            }
            if (!options.finished) { // cancel button
                buttonList.push(
                    <div className="message__button" key={3}>
                        <button className="button-custom cancel"
                            onClick={() => { this.cancelFile(options.fileID) }}>
                            {langs.get('ButtonCancelFile')}
                        </button>
                    </div>
                )
            }
        }

        if (options.fileID) {
            return (
                <div className={'message ' + (options.fromSelf ? 'right' : 'left')}>
                    <div className="message__inner message-file">
                        <img className="message__fileicon size30margin10" style={{ marginLeft: 0 }}
                            src={options.fromSelf ? imgUpload : imgDownload} />
                        <div className="message__fileinfo">
                            <div className="message__filename draggable">{message} ( {fileSizeStr} )</div>
                        </div>
                        <div className="clearfix"></div>
                        <div style={{ width: '100%' }}>{buttonList}</div>
                        <div className="clearfix"></div>
                        <div style={{ height: 10 }}></div>
                        {options.canceled ?
                            <React.Fragment>
                                <div style={{ width: '100%', textAlign: 'center' }}>{langs.get('StatusCanceled')}</div>
                            </React.Fragment>
                            : !options.accepted ?
                                <React.Fragment>
                                    <div style={{ width: '100%', textAlign: 'center' }}>{langs.get('StatusAcceptWaiting')}</div>
                                </React.Fragment>
                                : options.finished ?
                                    <React.Fragment>
                                        <div style={{ width: '100%', textAlign: 'center' }}>{langs.get('StatusCompleted')}</div>
                                    </React.Fragment>
                                    : <React.Fragment>
                                        <Line style={{ width: "100%", height: 10 }}
                                            percent={percent} strokeWidth="2" strokeColor="#5C3E73" /><br />
                                        <div style={{ width: '100%', fontSize: 10, textAlign: 'center' }}>
                                            {accumSize} / {fileSize}
                                        </div>
                                        <div>
                                            <div style={{ float: 'left' }}>{percent}%</div>
                                            <div style={{ float: 'right' }}>{speedStr}</div>
                                        </div>
                                    </React.Fragment>}
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className={'message ' + (options.fromSelf ? 'right' : 'left')}>
                    <div className="message__inner draggable">{this.renderMessage(message)}</div>
                </div>
            )
        }
    }
}

ChatMessage.propTypes = {
    selectedUser: PropTypes.object,
    message: PropTypes.object,
}