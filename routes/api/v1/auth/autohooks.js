'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function userAutoHooks(fastify, opts) {
  fastify.register(schemas)

  fastify.decorate('usersDataSource', { // [1]
    async readUser(username) { // [2]
      const client = await fastify.pg.connect()
      try {
        const { rows } = await client.query(
          'SELECT * FROM school_manager.Users WHERE username=$1', [username],
        )
        return rows[0]
      } finally {
        client.release()
      }
    },
    async createUser(user) { // [3]
      return fastify.pg.transact(async client => {
        const { rows } = await client.query(
          `INSERT INTO school_manager.Users(
            username,
            pass_salt,
            pass_hash,
            first_name,
            last_name,
            middle_name,
            role_id,
            birthday,
            sex,
            address,
            phone_number
            ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [
            user.username,
            user.salt,
            user.hash,
            user.first_name,
            user.last_name,
            user.middle_name,
            user.role_id,
            user.birthday,
            user.sex,
            user.address,
            user.phone_number
          ])
        let id = rows[0].id
        console.log(id)
        return id
      })
    }
  })
}, {
  encapsulate: true,
  dependencies: ['@fastify/postgres']
})
