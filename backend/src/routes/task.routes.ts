import { FastifyInstance } from 'fastify';
import * as taskController from '../controllers/task.controller';
import { requireRole } from '../middleware/role';
import { isTaskAssigneeOrOwner } from '../middleware/ownership';

export default async function taskRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Any authenticated user can get tasks, controller scopes the query
  fastify.get('/', taskController.getTasks);

  // Admin and PM can create tasks
  fastify.post('/', { preHandler: [requireRole(['ADMIN', 'PROJECT_MANAGER'])] }, taskController.createTask);

  // All roles can update status, but ownership middleware verifies they have access
  fastify.patch('/:taskId/status', { preHandler: [isTaskAssigneeOrOwner] }, taskController.updateTaskStatus);
}
