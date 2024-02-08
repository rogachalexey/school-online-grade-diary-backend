'use strict'

const fp = require('fastify-plugin')
const path = require('path')
const fastifyStatic = require('@fastify/static')

module.exports = fp(async function staticPlugin(fastify, opts) {
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../build'),
    prefix: '/'
  })
})