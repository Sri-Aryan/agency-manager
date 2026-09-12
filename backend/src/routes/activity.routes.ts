import { FastifyInstance } from 'fastify';
import * as activityController from '../controllers/activity.controller';

export default async function activityRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // All roles can get their activity feed, controller scopes the response
  fastify.get('/', activityController.getActivityFeed);
}
