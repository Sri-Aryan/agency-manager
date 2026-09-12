import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { wsService } from '../services/ws.service';
import { prisma } from '../lib/prisma';


export default fp(async function (fastify: FastifyInstance) {
  fastify.register(websocket, {
    options: { maxPayload: 1048576 }
  });

  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, async (socket: any, req: FastifyRequest) => {
      // 1. Authenticate via token in query params
      const { token } = req.query as { token?: string };
      if (!token) {
        socket.close(1008, 'Token required');
        return;
      }

      try {
        // Manually verify since we can't easily rely on preHandler hooks mutating req in native WS upgrade
        const decoded: any = fastify.jwt.verify(token);
        const userId = decoded.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        // 2. Add client to WS service
        wsService.addClient(user.id, socket);

        // 3. Subscribe to role-based rooms
        if (user.role === 'ADMIN') {
          wsService.joinRoom('GLOBAL', socket);
        } else if (user.role === 'PROJECT_MANAGER') {
          // Subscribe to all projects created by this PM
          const projects = await prisma.project.findMany({ where: { createdBy: user.id }, select: { id: true } });
          for (const p of projects) {
            wsService.joinRoom(`PROJECT_${p.id}`, socket);
          }
        }
        // Developers don't join project rooms; they receive direct messages to their userId via `wsService.sendToUser(developerId, ...)`

        // Broadcast presence update to Admins
        wsService.broadcastToRoom('GLOBAL', {
          type: 'presence_update',
          payload: { onlineCount: wsService.getOnlineUsersCount() }
        });

        socket.on('close', () => {
          wsService.broadcastToRoom('GLOBAL', {
            type: 'presence_update',
            payload: { onlineCount: wsService.getOnlineUsersCount() }
          });
        });

      } catch (err) {
        fastify.log.error(err);
        socket.close(1008, 'Invalid token');
      }
    });
  });
});
