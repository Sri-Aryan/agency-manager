import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/signup', authController.signup);
  fastify.post('/login', authController.login);
  fastify.post('/refresh', authController.refresh);
  fastify.post('/logout', authController.logout);
  
  // Protected route for testing
  fastify.get('/me', { preValidation: [fastify.authenticate] }, authController.me);
}
