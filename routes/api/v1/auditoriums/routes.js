'use strict'

module.exports = async function auditoriumsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const auditoriumTableName = 'Auditoriums'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:auditorium:list:query'),
            response: {
                200: fastify.getSchema('schema:auditorium:list:response')
            }
        },
        handler: async function listAuditoriums(request, reply) {
            if (!await this.permissions.canGetItems(auditoriumTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const auditoriums = await this.auditoriumsDataSource.listAuditoriums({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(auditoriumTableName)
            return { data: auditoriums, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:auditorium:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createChat(request, reply) {
            if (!await this.permissions.canInsertItems(auditoriumTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.auditoriumsDataSource.createAuditorium(request.body)
            reply.code(201)
            return { id: insertedId }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:auditorium')
            }
        },
        handler: async function getChat(request, reply) {
            if (!await this.permissions.canGetItems(auditoriumTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(auditoriumTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Auditorium not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:auditorium')
        },
        handler: async function updateAuditorium(request, reply) {
            if (!await this.permissions.canUpdateItems(auditoriumTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.auditoriumsDataSource.updateAuditorium(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Auditorium not found' }
            }
            reply.code(204)
            return { message: 'Auditorium successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteAuditorium(request, reply) {
            if (!await this.permissions.canDeleteItems(auditoriumTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(auditoriumTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Auditorium not found' }
            }
            reply.code(204)
            return { message: 'Auditorium successfully deleted' }
        }
    })
}