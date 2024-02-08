'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function auditoriumsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('auditoriumsDataSource', {
        async listAuditoriums({ skip = 0, limit = 50, auditorium_number, teacher_id, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.Auditoriums '
                if (auditorium_number != undefined || teacher_id != undefined || from != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (auditorium_number != undefined) {
                        query += ` auditorium_number = ${auditorium_number}`
                        flag = true
                    }
                    if (teacher_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (from != undefined && to != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` auditorium_number BETWEEN ${from} AND ${to}`
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
        async createAuditorium({ auditorium_number, teacher_id, description = '' }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Auditoriums(auditorium_number,teacher_id,description) VALUES($1,$2,$3) RETURNING id`,
                    [auditorium_number, teacher_id, description])
                let id = rows[0].id
                return id
            })
        },
        async updateAuditorium({ id, auditorium_number, teacher_id, description }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Auditoriums WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Auditoriums SET 
                            auditorium_number = $1,
                            teacher_id = $2,
                            description = $3
                            WHERE id = $4`,
                        [
                            auditorium_number || item.auditorium_number,
                            teacher_id || item.teacher_id,
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
    name: 'auditoriums-hook'
})