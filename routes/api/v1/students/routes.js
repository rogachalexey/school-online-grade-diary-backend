'use strict'

module.exports = async function studentsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const userTableName = 'Users'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:student:list:query'),
            response: {
                200: fastify.getSchema('schema:student:list:response')
            }
        },
        handler: async function listStudents(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const teachers = await this.studentsDataSource.listStudents({ ...request.query })
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
                200: fastify.getSchema('schema:student')
            }
        },
        handler: async function readUser(request, reply) {
            if (!await this.permissions.canGetItems(userTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.studentsDataSource.getStudent(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Student not found' }
            }
            return item
        }
    })
}