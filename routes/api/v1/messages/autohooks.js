'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function messagesAutoHooks(fastify, opts) {
    fastify.register(schemas)

    const selectQuery = `
    SELECT
        m.id,
        m.chat_id,
        m.create_time,
        m.update_time,
        m.content,
        m.user_id,
        u.first_name AS user_first_name
    FROM
        school_manager.Messages m
    JOIN
        school_manager.Users u ON m.user_id = u.id
    `

    fastify.decorate('messagesDataSource', {
        async listMessages({ chat_id, user_id, content, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = selectQuery
                if (chat_id != undefined || user_id != undefined || content != undefined
                    // || from != undefined
                ) {
                    query += 'WHERE'
                    let flag = false
                    if (chat_id != undefined) {
                        query += ` m.chat_id = ${chat_id}`
                        flag = true
                    }
                    if (user_id != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` m.user_id = ${user_id}`
                        flag = true
                    }
                    if (content != undefined) {
                        if (flag) {
                            query += ' AND'
                        }
                        query += ` m.content ILIKE '%${teacher_id}%'`
                        flag = true
                    }
                    // if (from != undefined && to != undefined) {
                    //     if (flag) {
                    //         query += ' AND'
                    //     }
                    //     query += ` message_number BETWEEN ${from} AND ${to}`
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
        async createMessage({ chat_id, user_id, content }) {
            return fastify.pg.transact(async client => {
                const create_time = new Date().toISOString()
                const { rows } = await client.query(
                    `INSERT INTO school_manager.Messages(chat_id,user_id,create_time,content) VALUES($1,$2,$3,$4) RETURNING id`,
                    [chat_id, user_id, create_time, content])
                let id = rows[0].id
                return id
            })
        },
        async updateMessage({ id, chat_id, user_id, content }) {
            return fastify.pg.transact(async client => {
                const { rows } = await client.query(
                    'SELECT * FROM school_manager.Messages WHERE id=$1', [id],
                )
                if (rows[0]) {
                    const item = rows[0]
                    const update_time = new Date().toISOString()
                    const result = await client.query(
                        `UPDATE school_manager.Messages SET 
                            chat_id = $1,
                            user_id = $2,
                            content = $3,
                            update_time = $4
                            WHERE id = $5`,
                        [
                            chat_id || item.chat_id,
                            user_id || item.user_id,
                            content || item.content,
                            update_time,
                            id])
                    return result.rowCount
                }
                return 0;
            })
        },
        async getMessage(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    selectQuery + ` WHERE m.id=$1`, [id],
                )
                return rows[0]
            } finally {
                client.release()
            }
        },
        async getChatId(id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    `SELECT chat_id FROM school_manager.Messages WHERE id=$1`, [id],
                )
                return rows.length > 0 ? rows[0].chat_id : null
            } finally {
                client.release()
            }
        },
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'messages-hook'
})