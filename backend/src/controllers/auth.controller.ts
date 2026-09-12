import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']).optional(),
});

export async function signup(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, password, role } = signupSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'DEVELOPER'
      }
    });

    const payload = { id: user.id, role: user.role, email: user.email };
    const accessToken = request.server.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = request.server.jwt.sign(payload, { expiresIn: '7d' });

    reply
      .setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
      .send({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const payload = { id: user.id, role: user.role, email: user.email };
    
    // Generate short-lived access token
    const accessToken = request.server.jwt.sign(payload, { expiresIn: '15m' });
    
    // Generate long-lived refresh token
    const refreshToken = request.server.jwt.sign(payload, { expiresIn: '7d' });

    reply
      .setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
      .send({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Bad Request', message: error.errors });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'No refresh token' });
    }

    const decoded = request.server.jwt.verify<{ id: string; role: string; email: string }>(refreshToken);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
    }

    const payload = { id: user.id, role: user.role, email: user.email };
    const newAccessToken = request.server.jwt.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = request.server.jwt.sign(payload, { expiresIn: '7d' });

    reply
      .setCookie('refreshToken', newRefreshToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
  } catch (error) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  reply
    .clearCookie('refreshToken', { path: '/' })
    .send({ message: 'Logged out successfully' });
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ user: request.user });
}
