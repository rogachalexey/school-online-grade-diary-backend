'use strict'

const fp = require('fastify-plugin')

module.exports = fp(function schemaLoaderPlugin(fastify, opts, next) {
  fastify.addSchema(require('./dotenv.json'))
  fastify.addSchema(require('./user.json'))
  fastify.addSchema(require('./limit.json'))
  fastify.addSchema(require('./skip.json'))
  fastify.addSchema(require('./read-params.json'))
  fastify.addSchema(require('./create-response.json'))

  next()
}, { name: 'application-schemas' })