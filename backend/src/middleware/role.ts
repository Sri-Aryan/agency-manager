import { FastifyReply, FastifyRequest } from 'fastify';

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // The authenticate decorator must be run before this middleware
    const user = request.user;
    
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
  };
}
