const express = require("express")
const routes = express.Router()

const TestController = require("@controllers/test-controller")

routes.get("/", TestController.test)

module.exports = routes