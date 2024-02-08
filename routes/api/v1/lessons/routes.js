'use strict'

module.exports = async function lessonsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const lessonTableName = 'Lessons'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:lesson:list:query'),
            response: {
                200: fastify.getSchema('schema:lesson:list:response')
            }
        },
        handler: async function listLessons(request, reply) {
            if (!await this.permissions.canGetItems(lessonTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const lessons = await this.lessonsDataSource.listLessons({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(lessonTableName)
            return { data: lessons, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:lesson:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createLesson(request, reply) {
            if (!await this.permissions.canInsertItems(lessonTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.lessonsDataSource.createLesson(request.body)
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
                200: fastify.getSchema('schema:lesson')
            }
        },
        handler: async function readLesson(request, reply) {
            if (!await this.permissions.canGetItems(lessonTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(lessonTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'lesson not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:lesson')
        },
        handler: async function updateLesson(request, reply) {
            if (!await this.permissions.canUpdateItems(lessonTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.lessonsDataSource.updateLesson(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Lesson not found' }
            }
            reply.code(204)
            return { message: 'Lesson successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteLesson(request, reply) {
            if (!await this.permissions.canDeleteItems(lessonTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(lessonTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Lesson not found' }
            }
            reply.code(204)
            return { message: 'Lesson successfully deleted' }
        }
    })
}