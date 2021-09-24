const express = require('express')
const app = express()
require('module-alias/register')

const bodyParser = require('body-parser')

app.disable('x-powered-by')
app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }))

app.use(require('@routes'))

module.exports = app