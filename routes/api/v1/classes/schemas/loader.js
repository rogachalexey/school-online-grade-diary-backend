'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function schemaLoaderPlugin(fastify, opts) {
    fastify.addSchema(require('./class.json'))
    fastify.addSchema(require('./list-response.json'))
    fastify.addSchema(require('./list-query.json'))
    fastify.addSchema(require('./create-body.json'))
})