'use strict'

module.exports = async function scheduleRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const scheduleTableName = 'Lessons'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:schedule:list:query'),
            response: {
                200: fastify.getSchema('schema:schedule:list:response')
            }
        },
        handler: async function listSchedule(request, reply) {
            if (!await this.permissions.canGetItems(scheduleTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const schedule = await this.scheduleDataSource.listSchedule({ ...request.query })
            const currentWeek = await this.scheduleDataSource.getCurrentWeekId()
            const currentDay = this.scheduleDataSource.getCurrentDay()

            return { data: schedule, currentDay, currentWeekId: currentWeek.id }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/current-week',
        handler: async function listSchedule(request, reply) {
            const currentWeek = await this.scheduleDataSource.getCurrentWeekId()
            const currentDay = this.scheduleDataSource.getCurrentDay()

            return { currentDay, currentWeekId: currentWeek.id }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:schedule')
            }
        },
        handler: async function readSchedule(request, reply) {
            if (!await this.permissions.canGetItems(scheduleTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.scheduleDataSource.getSchedule(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Schedule not found' }
            }
            return item
        }
    })
}