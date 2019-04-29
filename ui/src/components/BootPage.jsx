import React, { Component } from 'react'
import PropTypes from 'prop-types';

import setting from '../setting';
import boot from '../boot';

export default class BootPage extends Component {
    constructor(props) {
        super(props);
    };

    componentDidMount() {
        boot.event.on('updated', this.updateUI);
    }

    componentWillUnmount() {
        boot.event.removeListener('updated', this.updateUI);
    }

    updateUI = () => {
        this.forceUpdate();
    }

    render() {
        let bootInfo = boot.getBootInformation();
        let settingValue = setting.getValue();
        
        return (
            <React.Fragment>
                <h1>Hello Tor!</h1>
                tor status: {bootInfo.progress}<br />
                {settingValue.useBridge}<br />
                {settingValue.bridge}<br />
            </React.Fragment>
        )
    }
}

BootPage.propTypes = {
}