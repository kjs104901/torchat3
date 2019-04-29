import React, { Component } from 'react'
import PropTypes from 'prop-types';

import BootPage from './components/BootPage';
import ChatPage from './components/ChatPage';
import SettingPage from './components/SettingPage';

import setting from './setting';
import boot from './boot';

import './App.css'
import './themes/day.css'
import './themes/night.css'

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedPage: 1, // 1:Chatting // 2:Setting
        };
    };

    componentDidMount() {
        setting.event.on('updateUI', this.updateUI);
        boot.event.on('finished', this.updateUI);
    }

    componentWillUnmount() {
        setting.event.removeListener('updateUI', this.updateUI);
        boot.event.removeListener('finished', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    selectPage = (num) => { this.setState({ selectedPage: num }) }

    renderPage() {
        let bootInfo = boot.getBootInformation();
        if (bootInfo.success == false || bootInfo.failed == true) {
            //test
            console.log("bootrender");
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
        let settingValue = setting.getValue();

        return (
            <div id='page' className={setting.getValue().nigthMode ? 'night-mode' : 'day-mode'}>
                {this.renderPage()}
            </div>
        )
    }
}

App.propTypes = {
}
