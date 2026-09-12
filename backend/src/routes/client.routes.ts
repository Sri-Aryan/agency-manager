import { FastifyInstance } from 'fastify';
import * as clientController from '../controllers/client.controller';
import { requireRole } from '../middleware/role';

export default async function clientRoutes(fastify: FastifyInstance) {
  // Allow Admin and Project Managers to manage and view clients
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', requireRole(['ADMIN', 'PROJECT_MANAGER']));

  fastify.post('/', clientController.createClient);
  fastify.get('/', clientController.getClients);
}
