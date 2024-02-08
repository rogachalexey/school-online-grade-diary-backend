'use strict'

const fp = require('fastify-plugin')
const fastifyCors = require('@fastify/cors')

module.exports = fp(async function corsPlugin(fastify, opts) {
  fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      if (/localhost/.test(origin) || !origin) {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
})