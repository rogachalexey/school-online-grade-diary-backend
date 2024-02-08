'use strict'

module.exports = async function classMembersRoutes(fastify, _opts) {
    fastify.addHook('onRequest', fastify.authenticate)

    const classMembersTableName = 'Class_Members'

    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: fastify.getSchema('schema:class-member:list:query'),
            response: {
                200: fastify.getSchema('schema:class-member:list:response')
            }
        },
        handler: async function listClassMembers(request, reply) {
            if (!await this.permissions.canGetItems(classMembersTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const classMemberss = await this.classMembersDataSource.listClassMembers({ ...request.query })
            const totalCount = await this.rdDatabaseOperations.getItemsCount(classMembersTableName)
            return { data: classMemberss, totalCount }
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class-member:create:body'),
            response: {
                201: fastify.getSchema('schema:general:create:response')
            }
        },
        handler: async function createClassMembers(request, reply) {
            if (!await this.permissions.canInsertItems(classMembersTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const insertedId = await this.classMembersDataSource.createClassMembers(request.body)
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
                200: fastify.getSchema('schema:class-member')
            }
        },
        handler: async function readClassMember(request, reply) {
            if (!await this.permissions.canGetItems(classMembersTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const item = await this.classMembersDataSource.getClassMember(request.params.id)
            if (!item) {
                reply.code(404)
                return { error: 'Class member not found' }
            }
            return item
        }
    })

    fastify.route({
        method: 'PUT',
        url: '/',
        schema: {
            body: fastify.getSchema('schema:class-member')
        },
        handler: async function updateClassMember(request, reply) {
            if (!await this.permissions.canUpdateItems(classMembersTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.classMembersDataSource.updateAllClassMember(request.body)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class Member not found' }
            }
            reply.code(204)
            return { message: 'class-member successfully updated' }
        }
    })

    fastify.route({
        method: 'DELETE',
        url: '/:id',
        schema: {
            params: fastify.getSchema('schema:general:read:params')
        },
        handler: async function deleteClassMember(request, reply) {
            if (!await this.permissions.canDeleteItems(classMembersTableName, request.user.role_id)) {
                reply.code(403)
                return { error: 'You do not have permissions to this operation' }
            }
            const res = await this.rdDatabaseOperations.deleteItem(classMembersTableName, request.params.id)
            if (res === 0) {
                reply.code(404)
                return { error: 'Class Member not found' }
            }
            reply.code(204)
            return { message: 'Class Member successfully deleted' }
        }
    })
}