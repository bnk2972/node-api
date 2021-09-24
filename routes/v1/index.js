const express = require("express")
const routes = express.Router()

routes.use("/test", require("@routes/v1/test-route"))

module.exports = routes