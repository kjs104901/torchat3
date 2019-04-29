import React from 'react'
import { render } from 'react-dom'
import App from './App.jsx'

import language from './langs'

let app = render(
    <App />,
    document.getElementById('app')
)