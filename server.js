const express = require('express')
const app = express()

const bodyParser = require('body-parser')

app.disable('x-powered-by')
app.use(bodyParser.json({ limit: '25mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }))

module.exports = app