'use strict'

module.exports = async function schoolYearRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const schoolYearTableName = 'School_Years'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:school-year:list:query'),
            response: {
                200: fastify.getSchema('schema:school-year:list:response')
            }
        },
        handler: async function listSchoolYears(request, reply) {
            if (!await this.permissions.canGetItems(schoolYearTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const schoolYears = await this.schoolYearsDataSource.listSchoolYears({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(schoolYearTableName)
            return { data: schoolYears, totalCount }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:school-year')
            }
        },
        handler: async function readSchool(request, reply) {
            if (!await this.permissions.canGetItems(schoolYearTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.rdDatabaseOperations.getItem(schoolYearTableName, request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'School Year not found' }
            }
            return item
        }
    })
}