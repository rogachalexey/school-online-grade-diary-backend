'use strict'

module.exports = async function chatsRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const chatTableName = 'Chats'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:chat:list:query'),
            response: {
                200: fastify.getSchema('schema:chat:list:response')
            }
        },
        handler: async function listChats(request, reply) {
            if (!await this.permissions.canGetItems(chatTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const auditoriums = await this.chatsDataSource.listChats({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(chatTableName)
            return { data: auditoriums, totalCount }
        }
    })

    // fastify.route({
    //     method: 'POST',
    //     url: '/',
    //     schema: {
    //         body: fastify.getSchema('schema:chat:create:body'),
    //         response: {
    //             201: fastify.getSchema('schema:general:create:response')
    //         }
    //     },
    //     handler: async function createChat(request, reply) {
    //         if (!await this.permissions.canInsertItems(chatTableName, request.user.role_id)) {
    //             reply.code(403)
    //             return { error: 'You do not have permissions to this operation' }
    //         }
    //         const insertedId = await this.chatsDataSource.createChat(request.body)
    //         reply.code(201)
    //         return { id: insertedId }
    //     }
    // })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:chat')
            }
        },
        handler: async function getChat(request, reply) {
            if (!await this.permissions.canGetItems(chatTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.chatsDataSource.getChat(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Chat not found' }
            }
            return item
        }
    })

    // fastify.route({
    //     method: 'PUT',
    //     url: '/',
    //     schema: {
    //         body: fastify.getSchema('schema:chat')
    //     },
    //     handler: async function updateChat(request, reply) {
    //         if (!await this.permissions.canUpdateItems(chatTableName, request.user.role_id)) {
    //             reply.code(403)
    //             return { error: 'You do not have permissions to this operation' }
    //         }
    //         const res = await this.chatsDataSource.updateChat(request.body)
    //         if (res === 0) {
    //             reply.code(404)
    //             return { error: 'Chat not found' }
    //         }
    //         reply.code(204)
    //         return { message: 'Chat successfully updated' }
    //     }
    // })

    // fastify.route({
    //     method: 'DELETE',
    //     url: '/:id',
    //     schema: {
    //         params: fastify.getSchema('schema:general:read:params')
    //     },
    //     handler: async function deleteChat(request, reply) {
    //         if (!await this.permissions.canDeleteItems(chatTableName, request.user.role_id)) {
    //             reply.code(403)
    //             return { error: 'You do not have permissions to this operation' }
    //         }
    //         const res = await this.rdDatabaseOperations.deleteItem(chatTableName, request.params.id)
    //         if (res === 0) {
    //             reply.code(404)
    //             return { error: 'Chat not found' }
    //         }
    //         reply.code(204)
    //         return { message: 'Chat successfully deleted' }
    //     }
    // })
}