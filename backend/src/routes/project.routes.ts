import { FastifyInstance } from 'fastify';
import * as projectController from '../controllers/project.controller';
import { requireRole } from '../middleware/role';
import { isProjectOwner } from '../middleware/ownership';

export default async function projectRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Both ADMIN and PM can create/list projects
  fastify.post('/', { preHandler: [requireRole(['ADMIN', 'PROJECT_MANAGER'])] }, projectController.createProject);
  fastify.get('/', { preHandler: [requireRole(['ADMIN', 'PROJECT_MANAGER'])] }, projectController.getProjects);
  
  // Specific project details require ownership validation for PMs
  fastify.get('/:projectId', { preHandler: [requireRole(['ADMIN', 'PROJECT_MANAGER']), isProjectOwner] }, projectController.getProjectById);
}
