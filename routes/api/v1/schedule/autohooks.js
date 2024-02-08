'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function scheduleAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const select_query = `
        SELECT
            l.id,
            l.time,
            l.day,
            l.homework,
            s.name AS subject_name,
            l.subject_id,
            l.auditorium_id,
            a.auditorium_number,
            l.teacher_id,
            u.last_name AS teacher_last_name,
            u.first_name AS teacher_first_name,
            u.middle_name AS teacher_middle_name,
            l.class_id,
            c.class_letter,
            c.class_number,
            l.school_week_id
        FROM
            school_manager.Lessons l
        JOIN
            school_manager.Subjects s ON l.subject_id = s.id
        JOIN
            school_manager.Auditoriums a ON l.auditorium_id = a.id
        JOIN
            school_manager.Users u ON l.teacher_id = u.id
        JOIN
            school_manager.Classes c ON l.class_id = c.id
    `

    fastify.decorate('scheduleDataSource', {
        async listSchedule({
            class_id, auditorium_id, teacher_id, subject_id, time, day, school_week_id, homework
        }) {
            const client = await fastify.pg.connect()
            try {
                let query = select_query
                if (
                    class_id != undefined ||
                    auditorium_id != undefined ||
                    teacher_id != undefined ||
                    subject_id != undefined ||
                    time != undefined ||
                    day != undefined ||
                    school_week_id != undefined ||
                    homework != undefined
                ) {
                    query += 'WHERE'
                    let flag = false
                    if (class_id != undefined) {
                        query += ` l.class_id = ${class_id}`
                        flag = true
                    }
                    if (auditorium_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.auditorium_id = ${auditorium_id}`
                        flag = true
                    }
                    if (teacher_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (subject_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.subject_id = ${subject_id}`
                        flag = true
                    }
                    if (time != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.time = ${time}`
                        flag = true
                    }
                    if (day != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.day = ${day}`
                        flag = true
                    }
                    if (school_week_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.school_week_id = ${school_week_id}`
                        flag = true
                    }
                    if (homework != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` l.homework ILIKE '%${homework}%'`
                        flag = true
                    }
                    // if (from != undefined && to != undefined) {
                    //     if (flag) {
                    //         query += ' AND'
                    //     }
                    //     query += ` lesson_number BETWEEN ${from} AND ${to}`
                    // }
                }
                const { rows } = await client.query(
                    query)
                return rows
            } finally {
                client.release()
            }
        },
        async getSchedule(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    select_query + ` WHERE l.id=$1`, [id],
                )
                return rows[0]
            } finally {
                client.release()
            }
        },
        getCurrentDay() {
            const currentDate = new Date();
            let dayOfWeek = currentDate.getDay() + 1;
            return (dayOfWeek === 1) ? 7 : (dayOfWeek - 1);
        },
        async getCurrentWeekId() {
            const isoDateString = new Date().toISOString()
            const formattedDate = isoDateString.slice(0, 10)
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    `SELECT id
                    FROM school_manager.School_weeks
                    WHERE start_week <= $1 AND end_week >= $1;`, [formattedDate],
                )
                return rows[0]
            } finally {
                client.release()
            }
        }
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'schedule-hook'
})