import React, { Component } from 'react'
import PropTypes from 'prop-types';

import userList from '../userList';

export default class ChatMessage extends Component {
    constructor(props) {
        super(props);

        userList.event.on('updateFile', (address) => {
            if (address == this.props.selectedUser.address) {
                this.forceUpdate();
                console.log(this.props.selectedUser.messageList)
            }
        })

        this.state = {
        };
    };

    func = (arg) => {
        console.log(arg);
    }

    render() {
        const message = this.props.message.message;
        const options = this.props.message.options;
        if (options.fileID) {
            return (
                <div className='message'>
                    {options.fromMe? 'Me': 'User'} : {message} <br />
                    file: size:{options.fileSize} acc:{options.accepted} 
                    fin:{options.finished} err:{options.error} can:{options.canceled} spd:{options.speed}
                </div>
            )
        }
        else {
            return (
                <div className='message'>
                    {options.fromMe? 'Me': 'User'} : {message} <br />
                </div>
            )
        }
    }
}

ChatMessage.propTypes = {
    selectedUser: PropTypes.object,
    message: PropTypes.object,
}

//test
//options.fromMe = false;
//options.fileID = "";
//options.fileSize = 0;
//options.accepted = false;
//options.finished = false;
//options.error = false;
//options.canceled = false;
//options.accumSize = 0;
//options.speed = 0;