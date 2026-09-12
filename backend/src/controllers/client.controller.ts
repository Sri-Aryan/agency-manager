import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';


const createClientSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.string().optional(),
});

export async function createClient(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, contactInfo } = createClientSchema.parse(request.body);
    const userId = request.user.id;

    const client = await prisma.client.create({
      data: {
        name,
        contactInfo,
        createdBy: userId,
      }
    });

    return reply.code(201).send(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function getClients(request: FastifyRequest, reply: FastifyReply) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' }
    });
    return reply.send(clients);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
