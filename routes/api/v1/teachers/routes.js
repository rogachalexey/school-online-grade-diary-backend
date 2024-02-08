'use strict'

module.exports = async function teachersRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const userTableName = 'Users'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:teacher:list:query'),
            response: {
                200: fastify.getSchema('schema:teacher:list:response')
            }
        },
        handler: async function listTeachers(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const teachers = await this.teachersDataSource.listTeachers({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(userTableName)
            return { data: teachers, totalCount }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:teacher')
            }
        },
        handler: async function readUser(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.teachersDataSource.getTeacher(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Teacher not found' }
            }
            return item
        }
    })
}