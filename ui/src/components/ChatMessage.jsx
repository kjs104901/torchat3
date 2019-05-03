import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;

export default class ChatMessage extends Component {
    constructor(props) {
        super(props);

        userList.event.on('updateFile', (address) => {
            if (address == this.props.selectedUser.address) {
                this.forceUpdate();
            }
        })

        this.state = {
        };
    };

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
                    <span >{message}</span> <br />
                </React.Fragment>
            )
        })
        return lows;
    }

    render() {
        const message = this.props.message.message;
        const options = this.props.message.options;
        if (options.fileID) {
            return (
                <div className='message'>
                    {options.fromMe ? 'Me' : 'User'} : {message} <br />
                    file: size:{options.fileSize} accsize:{options.accumSize} acc:{options.accepted ? "true" : "false"}<br />
                    fin:{options.finished ? "true" : "false"} err:{options.error ? "true" : "false"} can:{options.canceled ? "true" : "false"} spd:{options.speed}<br />
                    acceptFile: <span onClick={() => { this.acceptFile(options.fileID) }}>accept</span><br />
                    cancelFile: <span onClick={() => { this.cancelFile(options.fileID) }}>cancel</span><br />
                    saveFile: <span onClick={() => { this.saveFile(options.fileID, message) }}>save</span><br />
                </div>
            )
        }
        else {
            return (
                <React.Fragment>
                    <div className='message'>
                        {options.fromMe ? 'Me' : 'User'} : {this.renderMessage(message)}
                    </div>
                    <br />
                </React.Fragment>
            )
        }
    }
}

ChatMessage.propTypes = {
    selectedUser: PropTypes.object,
    message: PropTypes.object,
}