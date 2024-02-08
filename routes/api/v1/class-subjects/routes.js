'use strict'

module.exports = async function classSubjectsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const classSubjectsTableName = 'Class_Subjects'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:class-subjects:list:query'),
            response: {
                200: fastify.getSchema('schema:class-subjects:list:response')
            }
        },
        handler: async function listClassSubjects(request, reply) {
            if (!await this.permissions.canGetItems(classSubjectsTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const classSubjectss = await this.classSubjectsDataSource.listClassSubjects({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(classSubjectsTableName)
            return { data: classSubjectss, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class-subjects:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createClassSubjects(request, reply) {
            if (!await this.permissions.canInsertItems(classSubjectsTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.classSubjectsDataSource.createClassSubjects(request.body)
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
                200: fastify.getSchema('schema:class-subjects')
            }
        },
        handler: async function readClassSubjects(request, reply) {
            if (!await this.permissions.canGetItems(classSubjectsTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(classSubjectsTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Class subjects not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class-subjects')
        },
        handler: async function updateClassSubjects(request, reply) {
            if (!await this.permissions.canUpdateItems(classSubjectsTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.classSubjectsDataSource.updateClassSubjects(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class subjects not found' }
            }
            reply.code(204)
            return { message: 'class-subjects successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteClassSubjects(request, reply) {
            if (!await this.permissions.canDeleteItems(classSubjectsTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(classSubjectsTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class subjects not found' }
            }
            reply.code(204)
            return { message: 'Class subjects successfully deleted' }
        }
    })
}