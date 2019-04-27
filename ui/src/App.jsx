import React, { Component } from 'react'
import PropTypes from 'prop-types';

import BootPage from './components/BootPage';
import ChatPage from './components/ChatPage';
import SettingPage from './components/SettingPage';

import './App.css'

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedPage: 1, // 1:Chatting // 2:Setting

            bootProgress: 0,
            bootSuccess: false,
            bootFailed: false,
            bootLogs: [],
        };
    };

    updateBootProgress = (progress) => { this.setState({ bootProgress: progress }) }
    updateBootLogs = (logs) => { this.setState({ bootLogs: logs }) }

    bootFailed = () => { this.setState({ bootFailed: true }) }
    bootSuccess = () => { this.setState({ bootSuccess: true }) }

    selectPage = (num) => { this.setState({ selectedPage: num }) }

    render() {
        if (this.state.bootSuccess == false || this.state.bootFailed == true) {
            // booting page
            return (
                <BootPage progress={this.state.bootProgress}></BootPage>
            )
        }
        else if (this.state.selectedPage == 1) {
            // Chatting page
            return (
                <ChatPage></ChatPage>
            )
        }
        else if (this.state.selectedPage == 2) {
            // Setting page
            return (
                <SettingPage></SettingPage>
            )
        }
    }
}

App.propTypes = {
}
