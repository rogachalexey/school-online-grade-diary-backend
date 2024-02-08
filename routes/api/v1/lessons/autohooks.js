'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function lessonsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('lessonsDataSource', {
        async listLessons({
            class_id, auditorium_id, teacher_id, subject_id, time, day, school_week_id, homework, from, to
        }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.Lessons '
                if (
                    class_id != undefined ||
                    auditorium_id != undefined ||
                    teacher_id != undefined ||
                    subject_id != undefined ||
                    time != undefined ||
                    day != undefined ||
                    school_week_id != undefined ||
                    homework != undefined
                    //  || from != undefined
                ) {
                    query += 'WHERE'
                    let flag = false
                    if (class_id != undefined) {
                        query += ` class_id = ${class_id}`
                        flag = true
                    }
                    if (auditorium_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` auditorium_id = ${auditorium_id}`
                        flag = true
                    }
                    if (teacher_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (subject_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` subject_id = ${subject_id}`
                        flag = true
                    }
                    if (time != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` time = ${time}`
                        flag = true
                    }
                    if (day != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` day = ${day}`
                        flag = true
                    }
                    if (school_week_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` school_week_id = ${school_week_id}`
                        flag = true
                    }
                    if (homework != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` homework ILIKE '%${homework}%'`
                        flag = true
                    }
                    // if (from != undefined && to != undefined) {
                    //     if (flag) {
                    //         query += ' AND'
                    //     }
                    //     query += ` lesson_number BETWEEN ${from} AND ${to}`
                    // }
                }
                query += ' ORDER BY id'
                const { rows } = await client.query(
                    query)
                return rows
            } finally {
                client.release()
            }
        },
        async createLesson({ class_id, auditorium_id, teacher_id, subject_id, time, day, school_week_id, homework = '' }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Lessons(
                        class_id,auditorium_id,teacher_id,subject_id,time,day,school_week_id,homework
                        ) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
                    [class_id, auditorium_id, teacher_id, subject_id, time, day, school_week_id, homework])
                let id = rows[0].id
                return id
            })
        },
        async updateLesson({ id, class_id, auditorium_id, teacher_id, subject_id, time, day, school_week_id, homework }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Lessons WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const result = await client.query(
                        `UPDATE school_manager.Lessons SET 
                            class_id = $1,
                            auditorium_id = $2,
                            teacher_id = $3,
                            subject_id = $4,
                            time = $5,
                            day = $6,
                            school_week_id = $7,
                            homework = $8
                            WHERE id = $9`,
                        [
                            class_id || item.class_id,
                            auditorium_id || item.auditorium_id,
                            teacher_id || item.teacher_id,
                            subject_id || item.subject_id,
                            time || item.time,
                            day || item.day,
                            school_week_id || item.school_week_id,
                            homework ?? item.homework,
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
    name: 'lessons-hook'
})