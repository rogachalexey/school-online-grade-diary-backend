'use strict'
const fp = require('fastify-plugin')

async function checkRolePermissions(fastify, roleId, table, method) {
    const client = await fastify.pg.connect()
    try {
        const permission = table + ' ' + method
        const { rows } = await client.query(
            `SELECT * FROM school_manager.Roles r
            JOIN
            school_manager.Role_Permissions rp ON r.id = rp.role_id
            JOIN
            school_manager.Permissions p ON rp.permission_id = p.id
            WHERE
            r.id = $1 AND p.name = $2;`, [roleId, permission],
        )
        return rows[0]
    } finally {
        client.release()
    }
}

module.exports = fp(async function auditoriumsAutoHooks(fastify, opts) {

    fastify.decorate('rdDatabaseOperations', {
        async getItemsCount(table) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    'SELECT COUNT(*) FROM school_manager.' + table)
                return rows[0].count
            } finally {
                client.release()
            }
        },
        async getItem(table, id) {
            const client = await fastify.pg.connect()
            try {
                const { rows } = await client.query(
                    `SELECT * FROM school_manager.${table} WHERE id=$1`, [id],
                )
                return rows[0]
            } finally {
                client.release()
            }
        },
        async deleteItem(table, id) {
            return fastify.pg.transact(async client => {
                const result = await client.query(
                    `DELETE FROM school_manager.${table} WHERE id = $1`, [id])
                return result.rowCount
            })
        }
    })

    fastify.decorate('permissions', {
        async canGetItems(table, roleId) {
            return await checkRolePermissions(fastify, roleId, table, 'GET') ? true : false
        },
        async canUpdateItems(table, roleId) {
            return await checkRolePermissions(fastify, roleId, table, 'UPDATE') ? true : false
        },
        async canDeleteItems(table, roleId) {
            return await checkRolePermissions(fastify, roleId, table, 'DELETE') ? true : false
        },
        async canInsertItems(table, roleId) {
            return await checkRolePermissions(fastify, roleId, table, 'INSERT') ? true : false
        }
    })

}, {
    encapsulate: true,
    dependencies: ['@fastify/postgres'],
    name: 'v1-hook'
})