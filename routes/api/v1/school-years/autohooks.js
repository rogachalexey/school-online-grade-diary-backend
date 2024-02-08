'use strict'
const fp = require('fastify-plugin')
const schemas = require('./schemas/loader')

module.exports = fp(async function schoolYearsAutoHooks(fastify, opts) {
    fastify.register(schemas)

    fastify.decorate('schoolYearsDataSource', {
        async listSchoolYears({ skip = 0, limit = 50, from, to }) {
            const client = await fastify.pg.connect()
            try {
                let query = 'SELECT * FROM school_manager.School_Years '
                // if (period != undefined
                //     //  || from != undefined
                // ) {
                //     query += 'WHERE'
                //     let flag = false
                //     if (period != undefined) {
                //         query += ` period = ILIKE '%${period}%'`
                //         flag = true
                //     }
                //     // if (from != undefined && to != undefined) {
                //     //     if (flag) {
                //     //         query += ' AND'
                //     //     }
                //     //     query += ` auditorium_number BETWEEN ${from} AND ${to}`
                //     // }
                // }
                query += ' ORDER BY id LIMIT $1 OFFSET $2'
                const { rows } = await client.query(
                    query,
                    [limit, skip])
                return rows
            } finally {
                client.release()
            }
        },
    })
}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'school-Years-hook'
})