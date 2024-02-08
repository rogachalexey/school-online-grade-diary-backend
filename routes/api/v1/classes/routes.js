'use strict'

module.exports = async function classesRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const classesTableName = 'Classes'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:class:list:query'),
            response: {
                200: fastify.getSchema('schema:class:list:response')
            }
        },
        handler: async function listClasses(request, reply) {
            if (!await this.permissions.canGetItems(classesTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const Classs = await this.classesDataSource.listClasses({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(classesTableName)
            return { data: Classs, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createClass(request, reply) {
            if (!await this.permissions.canInsertItems(classesTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.classesDataSource.createClass(request.body)
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
                200: fastify.getSchema('schema:class')
            }
        },
        handler: async function readClass(request, reply) {
            if (!await this.permissions.canGetItems(classesTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.classesDataSource.getClass(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Class not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class')
        },
        handler: async function updateClass(request, reply) {
            if (!await this.permissions.canUpdateItems(classesTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.classesDataSource.updateClass(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class not found' }
            }
            reply.code(204)
            return { message: 'Class successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteClass(request, reply) {
            if (!await this.permissions.canDeleteItems(classesTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(classesTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class not found' }
            }
            reply.code(204)
            return { message: 'Class successfully deleted' }
        }
    })
}