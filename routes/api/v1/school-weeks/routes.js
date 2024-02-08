'use strict'

module.exports = async function schoolWeeksRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const schoolWeekTableName = 'School_Weeks'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:school-week:list:query'),
            response: {
                200: fastify.getSchema('schema:school-week:list:response')
            }
        },
        handler: async function listSchoolWeeks(request, reply) {
            if (!await this.permissions.canGetItems(schoolWeekTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const schoolWeeks = await this.schoolWeeksDataSource.listSchoolWeeks({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(schoolWeekTableName)
            return { data: schoolWeeks, totalCount }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:school-week')
            }
        },
        handler: async function readSchool(request, reply) {
            if (!await this.permissions.canGetItems(schoolWeekTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(schoolWeekTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'School week not found' }
            }
            return item
        }
    })
}