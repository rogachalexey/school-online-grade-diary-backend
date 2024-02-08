'use strict'

module.exports = async function messagesRoutes(fastify, _opts) {
    // fastify.addHook('onRequest', fastify.authenticate)

    const chatClients = {}

    const messageTableName = 'Messages'

    function sendRefreshToChat(chatId) {
        const clients = chatClients[chatId] || [];

        for (const client of clients) {
            client.send('refresh')
        }
    }

    fastify.route({
        method: 'GET',
        url: '/connect/:chatId',
        websocket: true,
        handler: async function connect(connection, request) {
            const chatId = request.params.chatId

            connection.socket.on('message', (data) => {
                // Здесь можно обработать сообщение от клиента, если это необходимо
            })

            if (!chatClients[chatId]) {
                chatClients[chatId] = []
            }

            chatClients[chatId].push(connection.socket)

            connection.socket.on('close', () => {
                chatClients[chatId] = chatClients[chatId].filter((client) => client !== connection.socket)
            })
        }
    })

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:message:list:query'),
            response: {
                200: fastify.getSchema('schema:message:list:response')
            }
        },
        handler: async function listMessages(request, reply) {
            // if (!await this.permissions.canGetItems(messageTableName, request.user.role_id)) {
            //     reply.code(403)
            //     return { error: 'You do not have permissions to this operation' }
            // }
            const Messages = await this.messagesDataSource.listMessages({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(messageTableName)
            return { data: Messages, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:message:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createMessage(request, reply) {
            // if (!await this.permissions.canInsertItems(messageTableName, request.user.role_id)) {
            //     reply.code(403)
            //     return { error: 'You do not have permissions to this operation' }
            // }
            const insertedId = await this.messagesDataSource.createMessage(request.body)
            reply.code(201)
            sendRefreshToChat(request.body.chat_id)
            return { id: insertedId }
        }
    })

    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params'),
            response: {
                200: fastify.getSchema('schema:message')
            }
        },
        handler: async function readMessage(request, reply) {
            // if (!await this.permissions.canGetItems(messageTableName, request.user.role_id)) {
            //     reply.code(403)
            //     return { error: 'You do not have permissions to this operation' }
            // }
            const item = await this.messagesDataSource.getChat(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Message not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:message')
        },
        handler: async function updateMessage(request, reply) {
            // if (!await this.permissions.canUpdateItems(messageTableName, request.user.role_id)) {
            //     reply.code(403)
            //     return { error: 'You do not have permissions to this operation' }
            // }
            const res = await this.messagesDataSource.updateMessage(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Message not found' }
            }
            reply.code(204)
            const chatId = await this.messagesDataSource.getChatId(request.body.id)
            if (chatId) {
                sendRefreshToChat(chatId)
            }
            return { message: 'Message successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteMessage(request, reply) {
            // if (!await this.permissions.canDeleteItems(messageTableName, request.user.role_id)) {
            //     reply.code(403)
            //     return { error: 'You do not have permissions to this operation' }
            // }
            const chatId = await this.messagesDataSource.getChatId(request.params.id)
            const res = await this.rdDatabaseOperations.deleteItem(messageTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Message not found' }
            }
            reply.code(204)
            if (chatId) {
                sendRefreshToChat(chatId)
            }
            return { message: 'Message successfully deleted' }
        }
    })
}