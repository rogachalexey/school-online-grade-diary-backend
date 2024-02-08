'use strict'

module.exports = async function marksRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const markTableName = 'Marks'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:mark:list:query'),
            response: {
                200: fastify.getSchema('schema:mark:list:response')
            }
        },
        handler: async function listMarks(request, reply) {
            if (!await this.permissions.canGetItems(markTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const Marks = await this.marksDataSource.listMarks({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(markTableName)
            return { data: Marks, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:mark:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createMark(request, reply) {
            if (!await this.permissions.canInsertItems(markTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.marksDataSource.createMark(request.body)
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
                200: fastify.getSchema('schema:mark')
            }
        },
        handler: async function readMark(request, reply) {
            if (!await this.permissions.canGetItems(markTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(markTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Mark not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:mark')
        },
        handler: async function updateMark(request, reply) {
            if (!await this.permissions.canUpdateItems(markTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.marksDataSource.updateMark(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Mark not found' }
            }
            reply.code(204)
            return { message: 'Mark successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteMark(request, reply) {
            if (!await this.permissions.canDeleteItems(markTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(markTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Mark not found' }
            }
            reply.code(204)
            return { message: 'Mark successfully deleted' }
        }
    })
}