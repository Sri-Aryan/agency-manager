import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import activityRoutes from './routes/activity.routes';
import { startOverdueJob } from './jobs/overdue.job';
import wsPlugin from './plugins/websocket';
import { env } from './config/env';

const server = Fastify({
  logger: true
});

async function main() {
  await server.register(cors, {
    origin: true, // adjust based on frontend URL
    credentials: true
  });

  await server.register(authPlugin);
  await server.register(wsPlugin);
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(clientRoutes, { prefix: '/api/clients' });
  await server.register(projectRoutes, { prefix: '/api/projects' });
  await server.register(taskRoutes, { prefix: '/api/tasks' });
  await server.register(activityRoutes, { prefix: '/api/activity' });

  startOverdueJob();

  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
