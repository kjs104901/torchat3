import React, { Component } from 'react'
import PropTypes from 'prop-types';

const remoteControl = window.remoteControl;
const userList = window.userList;

export default class ChatMessage extends Component {
    constructor(props) {
        super(props);

        userList.event.on('updateFile', (address) => {
            if (address == this.props.selectedUser.address) {
                //if file
                this.forceUpdate();
                console.log(this.props.selectedUser.messageList)
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

    render() {
        const message = this.props.message.message;
        const options = this.props.message.options;
        if (options.fileID) {
            return (
                <div className='message'>
                    {options.fromMe ? 'Me' : 'User'} : {message} <br />
                    file: size:{options.fileSize} accsize:{options.accumSize} acc:{options.accepted ? "true" : "false"}<br />
                    fin:{options.finished ? "true" : "false"} err:{options.error ? "true" : "false"} can:{options.canceled ? "true" : "false"} spd:{options.speed}<br />
                    acceptFile: <span onClick={() => { this.acceptFile(options.fileID) }}>accept</span>
                    cancelFile: <span onClick={() => { this.cancelFile(options.fileID) }}>cancel</span>
                </div>
            )
        }
        else {
            return (
                <div className='message'>
                    {options.fromMe ? 'Me' : 'User'} : {message} <br />
                </div>
            )
        }
    }
}

ChatMessage.propTypes = {
    selectedUser: PropTypes.object,
    message: PropTypes.object,
}