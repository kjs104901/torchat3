import React, { Component } from 'react'
import PropTypes from 'prop-types';

export default class SettingPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    };

    render() {
        return (
            <React.Fragment>
                <div id='side-bar'>
                    <div id='side-menu'>
                        <div id='my-name'>my name</div>
                        <div id='my-address'>my address</div>
                        <div id='button-setting'
                            onClick={() => { this.props.selectPage(1) }}>
                            setting
                            </div>
                    </div>
                    <div id='side-content'>
                        세팅목록
                    </div>
                </div>
                <div id='content'>
                    세팅내용
                </div>
            </React.Fragment>
        )
    }
}

SettingPage.propTypes = {
    selectPage: PropTypes.func,
}