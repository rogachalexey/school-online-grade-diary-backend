'use strict'

const fp = require('fastify-plugin')
const fastifyWebsocket = require('@fastify/websocket')

module.exports = fp(async function websocketPlugin(fastify, opts) {
    fastify.register(fastifyWebsocket)
}, { dependencies: ['application-config'] })