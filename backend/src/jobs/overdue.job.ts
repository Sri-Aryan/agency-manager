import cron from 'node-cron';
import { prisma } from '../lib/prisma';


export function startOverdueJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Running overdue task check...');
    try {
      const now = new Date();
      
      // Find all tasks that are due, not done, and not already marked as overdue
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: 'DONE' },
          isOverdue: false
        }
      });

      if (overdueTasks.length === 0) {
        console.log('[CRON] No new overdue tasks found.');
        return;
      }

      console.log(`[CRON] Found ${overdueTasks.length} newly overdue tasks. Updating...`);

      // Update them to isOverdue = true
      await prisma.task.updateMany({
        where: {
          id: { in: overdueTasks.map(t => t.id) }
        },
        data: {
          isOverdue: true
        }
      });

      // Notify the PMs
      for (const task of overdueTasks) {
        const project = await prisma.project.findUnique({ where: { id: task.projectId } });
        if (project) {
          await prisma.notification.create({
            data: {
              userId: project.createdBy,
              type: 'TASK_OVERDUE',
              message: `Task "${task.title}" is now overdue.`,
              relatedTaskId: task.id
            }
          });
        }
      }

      console.log(`[CRON] Overdue update complete.`);
    } catch (error) {
      console.error('[CRON] Failed to run overdue task check:', error);
    }
  });
}
