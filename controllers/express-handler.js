const { errorHandler } = require('@errors/response-error')

function expressHandler ({ validator, handler }) {
    return async (request, response, next) => {
        try {
            const responseJson = await handler(request, response)
            if (response) response.json(responseJson)
        } catch (err) {
            errorHandler(err, response)
        }
    }
}

module.exports = {
    expressHandler
}