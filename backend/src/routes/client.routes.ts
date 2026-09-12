import { FastifyInstance } from 'fastify';
import * as clientController from '../controllers/client.controller';
import { requireRole } from '../middleware/role';

export default async function clientRoutes(fastify: FastifyInstance) {
  // Only Admin can manage clients
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', requireRole(['ADMIN']));

  fastify.post('/', clientController.createClient);
  fastify.get('/', clientController.getClients);
}
