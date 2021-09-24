function errorHandler (err, response) {
    const errType = err.name
    let resJson = { success : 0 }
    switch (errType) {
        case 'NotFoundError':
            return response
            .status(404)
            .json({ ...resJson, code : 404, err: 'not_found', message: err.message })
        case 'InvalidRequestError':
            return response
            .status(400)
            .json({ ...resJson, code : 400,err: 'bad_request', message: err.message, detail: err.detail })
        case 'OutOfStockError':
            return response
            .status(406)
            .json({ ...resJson, code : 406,err: 'bad_request', message: err.message })
        case 'DuplicateError':
            return response
            .status(409)
            .json({ ...resJson, code : 409,err: 'conflict', message: err.message })
        case 'RequestLargeError':
            return response
            .status(413)
            .json({ ...resJson, code : 413,err: 'bad_request', message: err.message, detail: err.detail })
        default:
            return response
            .status(500)
            .json({ ...resJson, code : 500,err: 'internal', message: err.message || 'error' })
    }
}

module.exports = {
    errorHandler
}