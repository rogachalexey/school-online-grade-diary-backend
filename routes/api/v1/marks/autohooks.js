'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function marksAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const selectQuery = `
    SELECT
        m.id,
        m.mark,
        m.student_id,
        m.lesson_id,
        l.class_id,
        l.subject_id,
        sw.id AS school_week_id
    FROM
        school_manager.Marks m
    JOIN
        school_manager.Lessons l ON m.lesson_id = l.id
    JOIN
        school_manager.School_weeks sw ON l.school_week_id = sw.id
    `

    fastify.decorate('marksDataSource', {
        async listMarks({ student_id, lesson_id, class_id, subject_id, mark, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = selectQuery
                if (student_id != undefined || lesson_id != undefined || class_id != undefined ||
                    subject_id != undefined || mark != undefined || from != undefined) {
                    query += 'WHERE'
                    let flag = false
                    if (student_id != undefined) {
                        query += ` m.student_id = ${student_id}`
                        flag = true
                    }
                    if (lesson_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` m.lesson_id = ${lesson_id}`
                        flag = true
                    }
                    if (class_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.class_id = ${class_id}`
                        flag = true
                    }
                    if (subject_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.subject_id = ${subject_id}`
                        flag = true
                    }
                    if (mark != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` m.mark = ${mark}`
                        flag = true
                    }
                    if (from != undefined && to != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` m.mark BETWEEN ${from} AND ${to}`
                    }
                }
                query += ' ORDER BY m.id'
                const { rows } = await client.query(query)
                return rows
            } finally {
                client.release()
            }
        },
        async createMark({ student_id, lesson_id, mark }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Marks(student_id,lesson_id,mark) VALUES($1,$2,$3) RETURNING id`,
                    [student_id, lesson_id, mark])
                let id = rows[0].id
                return id
            })
        },
        async updateMark({ id, student_id, lesson_id, mark }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Marks WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Marks SET 
                            student_id = $1,
                            lesson_id = $2,
                            mark = $3
                            WHERE id = $4`,
                        [
                            student_id || item.student_id,
                            lesson_id || item.lesson_id,
                            mark || item.mark,
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
    name: 'marks-hook'
})