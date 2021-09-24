const { expressHandler } = require("@controllers/express-handler")

async function test(request, response) {
    const { menu_id } = request.body
    if (!menu_id) return { code: 400 }
    else return { code: 200 }
}

module.exports = {
    test: expressHandler({
        handler: test
    })
}