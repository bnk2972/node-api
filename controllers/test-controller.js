const { expressHandler } = require("@controllers/express-handler")

async function test(request, response) {
    response.json({ code: 200 })
}

module.exports = {
    test: expressHandler({
        handler: test
    })
}