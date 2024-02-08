'use strict'

module.exports = async function subjectsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const subjectTableName = 'Subjects'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:subject:list:query'),
            response: {
                200: fastify.getSchema('schema:subject:list:response')
            }
        },
        handler: async function listSubjects(request, reply) {
            if (!await this.permissions.canGetItems(subjectTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const subjects = await this.subjectsDataSource.listSubjects({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(subjectTableName)
            return { data: subjects, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:subject:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createSubject(request, reply) {
            if (!await this.permissions.canInsertItems(subjectTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.subjectsDataSource.createSubject(request.body)
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
                200: fastify.getSchema('schema:subject')
            }
        },
        handler: async function readSubject(request, reply) {
            if (!await this.permissions.canGetItems(subjectTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(subjectTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Subject not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:subject')
        },
        handler: async function updateSubject(request, reply) {
            if (!await this.permissions.canUpdateItems(subjectTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.subjectsDataSource.updateSubject(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Subject not found' }
            }
            reply.code(204)
            return { message: 'Subject successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteSubject(request, reply) {
            if (!await this.permissions.canDeleteItems(subjectTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(subjectTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Subject not found' }
            }
            reply.code(204)
            return { message: 'Subject successfully deleted' }
        }
    })
}