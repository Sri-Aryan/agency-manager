import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';


export async function getActivityFeed(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    
    // Determine which tasks this user has visibility over
    let taskWhere: any = {};
    if (user.role === 'PROJECT_MANAGER') {
      taskWhere = { project: { createdBy: user.id } };
    } else if (user.role === 'DEVELOPER') {
      taskWhere = { assignedTo: user.id };
    }
    // ADMIN has global visibility, no filter

    const logs = await prisma.taskActivityLog.findMany({
      where: {
        task: taskWhere
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        task: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    // Format logs to match the WS payload structure
    const formattedLogs = logs.map(log => ({
      id: log.id,
      taskId: log.taskId,
      taskTitle: log.task.title,
      userId: log.userId,
      userName: log.user.name,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      timestamp: log.timestamp
    }));

    return reply.send(formattedLogs);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
