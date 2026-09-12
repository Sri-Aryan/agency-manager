const fs = require('fs');
const path = require('path');

const files = [
  'prisma/seed.ts',
  'src/plugins/websocket.ts',
  'src/middleware/ownership.ts',
  'src/jobs/overdue.job.ts',
  'src/controllers/task.controller.ts',
  'src/controllers/project.controller.ts',
  'src/controllers/client.controller.ts',
  'src/controllers/auth.controller.ts',
  'src/controllers/activity.controller.ts'
];

files.forEach(f => {
  const p = path.join(__dirname, f);
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace instantiation
  content = content.replace(/const prisma = new PrismaClient\(\);?\n?/, '');
  
  // Determine relative path to lib/prisma
  let libPath = '../lib/prisma';
  if (f === 'prisma/seed.ts') libPath = '../src/lib/prisma';
  if (f === 'src/plugins/websocket.ts') libPath = '../lib/prisma';
  if (f === 'src/middleware/ownership.ts') libPath = '../lib/prisma';
  if (f === 'src/jobs/overdue.job.ts') libPath = '../lib/prisma';

  // Update import
  if (content.includes('PrismaClient, ')) {
    content = content.replace(/import { PrismaClient, /g, 'import { ');
    content = `import { prisma } from '${libPath}';\n` + content;
  } else if (content.includes(', PrismaClient')) {
    content = content.replace(/, PrismaClient/g, '');
    content = `import { prisma } from '${libPath}';\n` + content;
  } else if (content.includes("import { PrismaClient } from '@prisma/client';")) {
    content = content.replace(/import { PrismaClient } from '@prisma\/client';/, `import { prisma } from '${libPath}';`);
  }
  
  fs.writeFileSync(p, content);
});
console.log('Fixed Prisma imports!');
