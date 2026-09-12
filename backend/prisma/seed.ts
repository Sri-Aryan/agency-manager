import { prisma } from '../src/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@agency.local';

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN
      }
    });
    console.log('Created Admin user:', admin.email);
  } else {
    console.log('Admin user already exists');
  }

  // Create a dummy developer
  const devEmail = 'dev@agency.local';
  let dev = await prisma.user.findUnique({ where: { email: devEmail } });
  if (!dev) {
    const passwordHash = await bcrypt.hash('dev123', 10);
    dev = await prisma.user.create({
      data: {
        name: 'John Developer',
        email: devEmail,
        passwordHash,
        role: Role.DEVELOPER
      }
    });
    console.log('Created Developer user:', dev.email);
  }

  // Check if we have clients
  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    const client = await prisma.client.create({
      data: {
        name: 'Acme Corp',
        contactInfo: 'contact@acme.com',
        createdBy: admin.id
      }
    });
    console.log('Created Client:', client.name);

    const project = await prisma.project.create({
      data: {
        name: 'Acme Website Redesign',
        clientId: client.id,
        createdBy: admin.id
      }
    });
    console.log('Created Project:', project.name);

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: 'Design Landing Page',
        description: 'Create Figma mockups for the landing page.',
        assignedTo: dev.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Due in 7 days
      }
    });
    console.log('Created Task:', task.title);

    // Initial activity log
    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: admin.id,
        toStatus: 'TODO',
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
