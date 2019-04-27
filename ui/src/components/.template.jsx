import React, { Component } from 'react'
import PropTypes from 'prop-types';

export default class /*[CLASSNAME]*/ extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sourceLang: 'es',
            destLang: 'en',
        };
    };

    func = (arg) => {
        console.log(arg);
    }

    render() {
        return (
            <React.Fragment>
                <div id=''>
                </div>
            </React.Fragment>
        )
    }
}

/*[CLASSNAME]*/CLASSNAME.propTypes = {
    userList: PropTypes.array
}
