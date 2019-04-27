import React, { Component } from 'react'
import PropTypes from 'prop-types';

export default class BootPage extends Component {
    constructor(props) {
        super(props);
    };

    render() {
        return (
            <React.Fragment>
            <h1>Hello Tor!</h1>
                tor status: {this.props.progress}
            </React.Fragment>
        )
    }
}

BootPage.propTypes = {
    progress: PropTypes.number
}