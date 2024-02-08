'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function classSubjectsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('classSubjectsDataSource', {
        async listClassSubjects({ skip = 0, limit = 50, class_id, subject_id, teacher_id, school_year_id, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.Class_Subjects '
                if (class_id != undefined || subject_id != undefined ||
                    teacher_id != undefined || school_year_id != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (class_id != undefined) {
                        query += ` class_id = ${class_id}`
                        flag = true
                    }
                    if (subject_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` subject_id = ${subject_id}`
                        flag = true
                    }
                    if (teacher_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (school_year_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` school_year_id = ${school_year_id}`
                        flag = true
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
        async createClassSubjects({ class_id, subject_id, teacher_id, school_year_id }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Class_Subjects(
                        class_id,subject_id,teacher_id,school_year_id
                        ) VALUES($1,$2,$3,$4) RETURNING id`,
                    [class_id, subject_id, teacher_id, school_year_id])
                let id = rows[0].id
                return id
            })
        },
        async updateClassSubjects({ id, class_id, subject_id, teacher_id, school_year_id }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Class_Subjects WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Class_Subjects SET 
                            class_id = $1,
                            subject_id = $2,
                            teacher_id = $3,
                            school_year_id = $4
                            WHERE id = $5`,
                        [
                            class_id || item.class_id,
                            subject_id || item.subject_id,
                            teacher_id || item.teacher_id,
                            school_year_id || item.school_year_id,
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
    name: 'class-subjects-hook'
})