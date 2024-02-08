'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function studentsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const select_query = `
    SELECT
        u.id,
        u.role_id,
        u.username,
        u.first_name,
        u.last_name,
        u.middle_name,
        u.birthday,
        u.phone_number,
        u.sex,
        u.address,
        u.description,
        TO_JSONB(
            JSONB_BUILD_OBJECT(
                'id', c.id,
                'class_letter', c.class_letter,
                'class_number', c.class_number,
                'teacher_id', cu.id,
                'teacher_first_name', cu.first_name,
                'teacher_last_name', cu.last_name,
                'teacher_middle_name', cu.middle_name
            )
        ) AS student_class
    FROM
        school_manager.Class_Members cm
    JOIN
        school_manager.Users u ON cm.student_id = u.id
    JOIN
        school_manager.Classes c ON cm.class_id = c.id
    LEFT JOIN
        school_manager.Users cu ON c.teacher_id = cu.id
    WHERE
        u.role_id = 3
    `

    fastify.decorate('studentsDataSource', {
        async listStudents({ skip = 0, limit = 50, username, first_name, last_name, middle_name, search, class_id, auditorium_id }) {
            const client = await fastify.pg.connect()
            let query = select_query
            try {
                if (username != undefined) {
                    query += ` AND username ILIKE '%${username}%'`
                }
                if (first_name != undefined) {
                    query += ` first_name ILIKE '%${first_name}%'`
                }
                if (last_name != undefined) {
                    query += ` AND last_name ILIKE '%${last_name}%'`
                }
                if (middle_name != undefined) {
                    query += ` AND middle_name ILIKE '%${middle_name}%'`
                }
                if (search != undefined) {
                    query += ` AND (first_name ILIKE '%${search}%' OR`
                    query += ` last_name ILIKE '%${search}%' OR`
                    query += ` middle_name ILIKE '%${search}%')`
                }
                if (class_id != undefined) {
                    query += ` AND class_id = ${class_id}`
                }
                if (auditorium_id != undefined) {
                    query += ` AND auditorium_id = ${auditorium_id}`
                }
                query += ' LIMIT $1 OFFSET $2'
                const { rows } = await client.query(
                    query,
                    [limit, skip])
                return rows
            } finally {
                client.release()
            }
        },

        async getStudent(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    select_query + ` AND u.id=$1`, [id],
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
    name: 'students-hook'
})