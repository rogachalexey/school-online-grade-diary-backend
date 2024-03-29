'use strict'

const fp = require('fastify-plugin')

const generateHash = require('./generate-hash') // [1]

module.exports.prefixOverride = '' // [2]
module.exports = fp(

  async function applicationAuth(fastify, opts) {
    fastify.post('/register', { // [1.1]
      schema: {
        body: fastify.getSchema('schema:auth:register') // [1.2]
      },
      handler: async function registerHandler(request, reply) {
        const existingUser = await this.usersDataSource.readUser(request.body.username) // [1.3]
        if (existingUser) { // [1.4]
          const err = new Error('User already registered')
          err.statusCode = 409
          throw err
        }

        const newUser = request.body

        const { hash, salt } = await generateHash(newUser.password) // [1.5]

        try {
          const newUserId = await this.usersDataSource.createUser({ // [1.6]
            salt,
            hash,
            ...newUser
          })
          request.log.info({ userId: newUserId }, 'User registered')

          reply.code(201)
          return { registered: true } // [1.7]
        } catch (error) {
          request.log.error(error, 'Failed to register user')
          reply.code(500)
          return { registered: false } // [1.8]
        }
      }
    })

    fastify.post('/authenticate', {
      schema: {
        body: fastify.getSchema('schema:auth:authenticate'),
        response: {
          200: fastify.getSchema('schema:auth:token')
        }
      },
      handler: async function authenticateHandler(request, reply) {
        const user = await this.usersDataSource.readUser(request.body.username)
        if (!user) {
          const err = new Error('Wrong credentials provided')
          err.statusCode = 401
          throw err
        }
        const { hash } = await generateHash(request.body.password, user.pass_salt)
        if (hash !== user.pass_hash) {
          const err = new Error('Wrong credentials provided')
          err.statusCode = 401
          throw err
        }
        request.user = user
        return refreshHandler(request, reply)
      }
    })

    fastify.get('/me', {
      onRequest: fastify.authenticate,
      schema: {
        headers: fastify.getSchema('schema:auth:token-header'),
        response: {
          200: fastify.getSchema('schema:user')
        }
      },
      handler: async function meHandler (request, reply) {
        return request.user
      }
    })

    fastify.post('/refresh', {
      onRequest: fastify.authenticate, // [3.1]
      schema: {
        headers: fastify.getSchema('schema:auth:token-header'),
        response: {
          200: fastify.getSchema('schema:auth:token')
        }
      },
      handler: refreshHandler // [3.2]
    })

    async function refreshHandler(request, reply) {
      request.revokeToken()
      const token = await request.generateToken() // [3.3]
      return { token }
    }

    fastify.post('/logout', {
      onRequest: fastify.authenticate, // [4.1]
      handler: async function logoutHandler(request, reply) {
        request.revokeToken() // [4.2]
        reply.code(204) // [4.3]
      }
    })
  }, {
  name: 'auth-routes',
  dependencies: ['authentication-plugin'], // [3]
  encapsulate: true
})
