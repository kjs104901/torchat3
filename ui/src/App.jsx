import React, { Component } from 'react'
import PropTypes from 'prop-types';

import BootPage from './components/BootPage';
import ChatPage from './components/ChatPage';
import SettingPage from './components/SettingPage';

const remoteControl = window.remoteControl;

import './assets/global.css'
import './assets/themes/night.css'
import './assets/themes/day.css'

import 'react-perfect-scrollbar/dist/css/styles.css';

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedPage: 1, // 1:Chatting // 2:Setting
        };
    };

    componentDidMount() {
        remoteControl.event.on('settingUpdate', this.updateUI);
        
        remoteControl.event.on('torUpdate', this.updateUI);
        remoteControl.event.on('torSuccess', this.updateUI);
        remoteControl.event.on('torFail', this.updateUI);
    }

    componentWillUnmount() {
        remoteControl.event.removeListener('settingUpdate', this.updateUI);
        
        remoteControl.event.removeListener('torUpdate', this.updateUI);
        remoteControl.event.removeListener('torSuccess', this.updateUI);
        remoteControl.event.removeListener('torFail', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    selectPage = (num) => { this.setState({ selectedPage: num }) }

    renderPage() {
        if (remoteControl.getSuccess() == false || remoteControl.getFail() == true) {  
            return (
                <BootPage />
            )
        }
        else if (this.state.selectedPage == 1) {
            return (
                <ChatPage
                    selectPage={this.selectPage} />
            )
        }
        else if (this.state.selectedPage == 2) {
            return (
                <SettingPage
                    selectPage={this.selectPage} />
            )
        }
    }

    render() {
        return (
            <div id='page' className={remoteControl.getSetting().nightMode ? 'night-mode' : 'day-mode'}>
                {this.renderPage()}
            </div>
        )
    }
}

App.propTypes = {
}
