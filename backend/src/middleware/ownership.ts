import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';


export async function isProjectOwner(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  const { projectId } = request.params as { projectId: string };

  if (user.role === 'ADMIN') return; // Admins have global access

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true }
  });

  if (!project) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found' });
  }

  // PM visibility strictly scoped to createdBy = self. (403 as per PRD decision)
  if (user.role === 'PROJECT_MANAGER' && project.createdBy !== user.id) {
    return reply.code(403).send({ error: 'Forbidden', message: 'You do not have access to this project' });
  }

  // Developers don't own projects, they only get task-level access
  if (user.role === 'DEVELOPER') {
    return reply.code(403).send({ error: 'Forbidden', message: 'Developers cannot manage projects' });
  }
}

export async function isTaskAssigneeOrOwner(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  const { taskId } = request.params as { taskId: string };

  if (user.role === 'ADMIN') return;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { createdBy: true } } }
  });

  if (!task) {
    return reply.code(404).send({ error: 'Not Found', message: 'Task not found' });
  }

  if (user.role === 'PROJECT_MANAGER' && task.project.createdBy !== user.id) {
    return reply.code(403).send({ error: 'Forbidden', message: 'Task belongs to a project you do not manage' });
  }

  if (user.role === 'DEVELOPER' && task.assignedTo !== user.id) {
    return reply.code(403).send({ error: 'Forbidden', message: 'You are not assigned to this task' });
  }
}
