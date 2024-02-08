'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function usersAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('usersDataSource', {
        async listUsers({ skip = 0, limit = 50, username, first_name, last_name, middle_name, search, role_id }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.Users '
                if (username != undefined || first_name != undefined || last_name != undefined ||
                    middle_name != undefined || search != undefined || role_id != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (username != undefined) {
                        query += ` username ILIKE '%${username}%'`
                        flag = true
                    }
                    if (first_name != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` first_name ILIKE '%${first_name}%'`
                        flag = true
                    }
                    if (last_name != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` last_name ILIKE '%${last_name}%'`
                        flag = true
                    }
                    if (middle_name != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` middle_name ILIKE '%${middle_name}%'`
                        flag = true
                    }
                    if (search != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` (first_name ILIKE '%${search}%' OR`
                        query += ` last_name ILIKE '%${search}%' OR`
                        query += ` middle_name ILIKE '%${search}%')`
                        flag = true
                    }
                    if (role_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` role_id = ${role_id}`
                    }
                }
                query += ' ORDER BY id LIMIT $1 OFFSET $2'
                const { rows } = await client.query(
                    query,
                    [limit, skip])
                return rows
            } finally {
                client.release()
            }
        },
        async updateUser({ id, username, first_name, last_name, middle_name, role_id, birthday, phone_number, sex, address }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Users WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Users SET 
                            username = $1,
                            first_name = $2,
                            last_name = $3,
                            middle_name = $4,
                            role_id = $5,
                            birthday = $6,
                            phone_number = $7,
                            sex = $8,
                            address = $9
                            WHERE id = $10`,
                        [
                            username || item.username,
                            first_name || item.first_name,
                            last_name || item.last_name,
                            middle_name || item.middle_name,
                            role_id || item.role_id,
                            birthday || item.birthday,
                            phone_number || item.phone_number,
                            sex || item.sex,
                            address || item.address,
                            id])
                    return result.rowCount
                }
                return 0;
            })
        }
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'users-hook'
})