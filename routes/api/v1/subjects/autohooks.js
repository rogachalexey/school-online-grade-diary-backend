'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function subjectsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('subjectsDataSource', {
        async listSubjects({ skip = 0, limit = 50, name, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.Subjects '
                if (name != undefined || from != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (name != undefined) {
                        query += ` name ILIKE '%${name}%'`
                        flag = true
                    }
                    if (from != undefined && to != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` subject_number BETWEEN ${from} AND ${to}`
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
        async createSubject({ name, description = '' }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Subjects(name,description) VALUES($1,$2) RETURNING id`,
                    [name, description])
                let id = rows[0].id
                return id
            })
        },
        async updateSubject({ id, name, description }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Subjects WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Subjects SET 
                            name = $1,
                            description = $2
                            WHERE id = $3`,
                        [
                            name || item.name,
                            description || item.description,
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
    name: 'subjects-hook'
})