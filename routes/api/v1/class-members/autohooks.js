'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function classMembersAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const select_query = `
    SELECT
        cm.id,
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.middle_name
    FROM
        school_manager.Class_Members cm
    JOIN
        school_manager.Users u ON cm.student_id = u.id
    `

    fastify.decorate('classMembersDataSource', {
        async listClassMembers({ skip = 0, limit = 50, class_id, student_id }) {
            const client = await fastify.pg.connect()
            try {
                let query = select_query
                if (class_id != undefined || student_id != undefined) {
                    query += ' WHERE'
                    let flag = false
                    if (class_id != undefined) {
                        query += ` cm.class_id = ${class_id}`
                        flag = true
                    }
                    if (student_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` cm.student_id = ${student_id}`
                    }
                }
                query += ' ORDER BY u.last_name LIMIT $1 OFFSET $2'
                const { rows } = await client.query(
                    query,
                    [limit, skip])
                return rows
            } finally {
                client.release()
            }
        },
        async createClassMember({ class_id, student_id }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Class_Members(
                        class_id, student_id
                        ) VALUES($1,$2) RETURNING id`,
                    [class_id, student_id])
                let id = rows[0].id
                return id
            })
        },
        async updateClassMember({ id, class_id, student_id }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Class_Members WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Class_Members SET 
                            class_id = $1,
                            student_id = $2
                            WHERE id = $3`,
                        [
                            class_id || item.class_id,
                            student_id || item.student_id,
                            id])
                    return result.rowCount
                }
                return 0;
            })
        },
        async updateAllClassMember({ id, class_id }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Class_Members WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Class_Members SET 
                            class_id = $1
                            WHERE student_id = $2`,
                        [
                            class_id || item.class_id,
                            id])
                    return result.rowCount
                }
                return 0;
            })
        },
        async getClassMember(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    `SELECT * FROM school_manager.Class_Members WHERE student_id=$1`, [id],
                )
                return rows[0]
            } finally {
                client.release()
            }
        },
        async deleteClassMember(id) {
            return fastify.pg.transact(async client => {
                const result = await client.query(
                    `DELETE FROM school_manager.Class_Members WHERE student_id = $1`, [id])
                return result.rowCount
            })
        }
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'class-members-hook'
})