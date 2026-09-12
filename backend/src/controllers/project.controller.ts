import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';


const createProjectSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
});

export async function createProject(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, clientId } = createProjectSchema.parse(request.body);
    const userId = request.user.id;

    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return reply.code(404).send({ error: 'Not Found', message: 'Client not found' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientId,
        createdBy: userId,
      }
    });

    return reply.code(201).send(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function getProjects(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    
    // PMs only see their own projects, Admins see all. Developers shouldn't access this (blocked by route middleware).
    const where = user.role === 'PROJECT_MANAGER' ? { createdBy: user.id } : {};

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } }
      }
    });

    return reply.send(projects);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function getProjectById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { projectId } = request.params as { projectId: string };
    // The isProjectOwner middleware handles checking if PM owns it
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        tasks: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!project) {
      return reply.code(404).send({ error: 'Not Found', message: 'Project not found' });
    }

    return reply.send(project);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
