'use strict'

module.exports = async function UsersRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const userTableName = 'Users'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:user:list:query'),
            response: {
                200: fastify.getSchema('schema:user:list:response')
            }
        },
        handler: async function listUsers(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const Users = await this.usersDataSource.listUsers({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(userTableName)
            return { data: Users, totalCount }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:user')
            }
        },
        handler: async function readUser(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(userTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'User not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:user')
        },
        handler: async function updateUser(request, reply) {
            if (!await this.permissions.canUpdateItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.usersDataSource.updateUser(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'User not found' }
            }
            reply.code(204)
            return { message: 'User successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteUser(request, reply) {
            if (!await this.permissions.canDeleteItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(userTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'User not found' }
            }
            reply.code(204)
            return { message: 'User successfully deleted' }
        }
    })
}