const express = require('express')
const routes = express.Router()

routes.use('/v1', require("@routes-v1"))

module.exports = routes