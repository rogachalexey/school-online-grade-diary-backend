'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function classesAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const selectQuery = `
    SELECT
        c.id,
        c.class_letter,
        c.class_number,
        u.id AS teacher_id,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.middle_name AS teacher_middle_name
    FROM
        school_manager.Classes c
    LEFT JOIN
        school_manager.Users u ON c.teacher_id = u.id `

    fastify.decorate('classesDataSource', {
        async listClasses({ skip = 0, limit = 50, class_letter, teacher_id, class_number, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = selectQuery
                if (class_letter != undefined || teacher_id != undefined || class_number != undefined || from != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (class_letter != undefined) {
                        query += ` c.class_letter = '${class_letter}'`
                        flag = true
                    }
                    if (teacher_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` c.teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (class_number != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` c.class_number = ${class_number}`
                        flag = true
                    }
                    if (from != undefined && to != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` c.class_number BETWEEN ${from} AND ${to}`
                    }
                }
                query += ' ORDER BY c.id LIMIT $1 OFFSET $2'
                const { rows } = await client.query(
                    query,
                    [limit, skip])
                return rows
            } finally {
                client.release()
            }
        },
        async createClass({ teacher_id, class_letter, class_number }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Classes(teacher_id,class_letter,class_number) VALUES($1,$2,$3) RETURNING id`,
                    [teacher_id, class_letter, class_number])
                let id = rows[0].id
                return id
            })
        },
        async updateClass({ id, teacher_id, class_letter, class_number }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Classes WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Classes SET 
                            teacher_id = $1,
                            class_letter = $2,
                            class_number = $3
                            WHERE id = $4`,
                        [
                            teacher_id || item.teacher_id,
                            class_letter || item.class_letter,
                            class_number || item.class_number,
                            id])
                    return result.rowCount
                }
                return 0;
            })
        },
        async getClass(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    selectQuery + ` WHERE c.id=$1`, [id],
                )
                return rows[0]
            } finally {
                client.release()
            }
        },
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'classes-hook'
})