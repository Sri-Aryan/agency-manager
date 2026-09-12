import { prisma } from '../lib/prisma';
import { FastifyReply, FastifyRequest } from 'fastify';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { z } from 'zod';


const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid(),
  status: z.nativeEnum(TaskStatus).default('TODO'),
  priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
  dueDate: z.string().datetime(), // ISO 8601 string
});

export async function createTask(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { projectId, title, description, assignedTo, status, priority, dueDate } = createTaskSchema.parse(request.body);
    const user = request.user;

    // Verify project access (PM can only assign if they own project)
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found' });
    
    if (user.role === 'PROJECT_MANAGER' && project.createdBy !== user.id) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Cannot assign tasks to a project you do not manage' });
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({ where: { id: assignedTo } });
    if (!assignee) return reply.code(400).send({ error: 'Bad Request', message: 'Assignee not found' });

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate: new Date(dueDate),
      }
    });

    // Write initial activity log
    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        toStatus: task.status,
      }
    });

    // We should also trigger notification logic here, but for now we'll stick to PRD logic.
    await prisma.notification.create({
      data: {
        userId: assignedTo,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned a new task: ${task.title}`,
        relatedTaskId: task.id,
      }
    });

    return reply.code(201).send(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function getTasks(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    const { status, priority, projectId, dueDateStart, dueDateEnd } = request.query as any;
    
    let where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    
    if (dueDateStart || dueDateEnd) {
      where.dueDate = {};
      if (dueDateStart) where.dueDate.gte = new Date(dueDateStart);
      if (dueDateEnd) where.dueDate.lte = new Date(dueDateEnd);
    }

    if (user.role === 'PROJECT_MANAGER') {
      where.project = { createdBy: user.id };
    } else if (user.role === 'DEVELOPER') {
      where.assignedTo = user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } }
      }
    });

    return reply.send(tasks);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

import { wsService } from '../services/ws.service';

const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export async function updateTaskStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { taskId } = request.params as { taskId: string };
    const { status } = updateTaskStatusSchema.parse(request.body);
    const user = request.user;
    
    // isTaskAssigneeOrOwner middleware ensures the user is allowed to touch this task.
    const oldTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!oldTask) return reply.code(404).send({ error: 'Not Found' });

    if (oldTask.status === status) {
      return reply.send(oldTask); // No change
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });

    const userDetails = await prisma.user.findUnique({ where: { id: user.id } });

    // Write activity log (This is the source of truth for the WS feed)
    const log = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        fromStatus: oldTask.status,
        toStatus: task.status,
      }
    });

    // WS Event Payload
    const wsPayload = {
      id: log.id,
      taskId: task.id,
      taskTitle: task.title,
      userId: user.id,
      userName: userDetails?.name || 'Unknown User',
      fromStatus: oldTask.status,
      toStatus: task.status,
      timestamp: log.timestamp
    };

    // Broadcast to global admins
    wsService.broadcastToRoom('GLOBAL', { type: 'task_update', payload: wsPayload });
    // Broadcast to project PMs
    wsService.broadcastToRoom(`PROJECT_${task.projectId}`, { type: 'task_update', payload: wsPayload });
    // Send directly to assigned Developer
    wsService.sendToUser(task.assignedTo, { type: 'task_update', payload: wsPayload });

    // Notifications logic
    if (status === 'IN_REVIEW') {
      const pmId = oldTask.project.createdBy;
      await prisma.notification.create({
        data: {
          userId: pmId,
          type: 'TASK_MOVED_TO_REVIEW',
          message: `Task ${task.title} is ready for review`,
          relatedTaskId: task.id
        }
      });
      wsService.sendToUser(pmId, { type: 'notification', payload: { count: 1 } });
    }

    return reply.send(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
