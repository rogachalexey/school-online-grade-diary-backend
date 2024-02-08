'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function auditoriumsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const selectQuery = `
    SELECT
        c.id,
        c.teacher_id,
        c.class_id,
        c.subject_id,
        u_teacher.first_name AS teacher_first_name,
        u_teacher.last_name AS teacher_last_name,
        u_teacher.middle_name AS teacher_middle_name,
        cl.class_letter,
        cl.class_number,
        s.name as subject_name
    FROM
        school_manager.Chats c
    JOIN
        school_manager.Users u_teacher ON c.teacher_id = u_teacher.id
    JOIN
        school_manager.Classes cl ON c.class_id = cl.id
    JOIN
        school_manager.Subjects s ON c.subject_id = s.id
    `

    fastify.decorate('chatsDataSource', {
        async listChats({ teacher_id, class_id, subject_id }) {
            const client = await fastify.pg.connect()
            try {
                let query = selectQuery
                if (teacher_id != undefined || class_id || subject_id) {
                    query += 'WHERE'
                    let flag = false
                    if (teacher_id != undefined) {
                        query += ` c.teacher_id = ${teacher_id}`
                        flag = true
                    }
                    if (class_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` c.class_id = ${class_id}`
                        flag = true
                    }
                    if (subject_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` c.subject_id = ${subject_id}`
                    }
                }
                query += ' ORDER BY c.id'
                const { rows } = await client.query(
                    query)
                return rows
            } finally {
                client.release()
            }
        },
        async getChat(id) {
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
    name: 'chats-hook'
})