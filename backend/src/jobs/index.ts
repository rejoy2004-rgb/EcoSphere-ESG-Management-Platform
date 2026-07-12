import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../services/notificationService';

const prisma = new PrismaClient();

async function flagOverdueComplianceIssues() {
  try {
    const today = new Date();
    const overdueIssues = await prisma.complianceIssue.findMany({
      where: {
        status: {
          notIn: ['RESOLVED', 'CLOSED']
        },
        dueDate: {
          lt: today
        }
      },
      include: {
        owner: true
      }
    });

    const esgManagers = await prisma.user.findMany({
      where: { role: 'ESG_MANAGER' }
    });

    for (const issue of overdueIssues) {
      await sendNotification(
        issue.ownerId,
        'COMPLIANCE_OVERDUE',
        `Your compliance issue: "${issue.description}" is overdue. Due date was ${issue.dueDate.toISOString().split('T')[0]}.`
      );

      for (const manager of esgManagers) {
        await sendNotification(
          manager.id,
          'COMPLIANCE_OVERDUE_ALERT',
          `Compliance issue assigned to ${issue.owner.name} ("${issue.description}") is overdue.`
        );
      }
    }
  } catch (error) {
    console.error('Failed to run overdue compliance issues cron:', error);
  }
}

async function sendPolicyAcknowledgementReminders() {
  try {
    const settings = await prisma.systemSetting.findFirst();
    const cadence = settings ? settings.policyReminderCadenceDays : 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - cadence);

    const pendingAcks = await prisma.policyAcknowledgement.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: thresholdDate
        }
      },
      include: {
        policy: true
      }
    });

    for (const ack of pendingAcks) {
      await sendNotification(
        ack.employeeId,
        'POLICY_REMINDER',
        `Acknowledgement reminder: Please review and sign the policy "${ack.policy.title}".`
      );
    }
  } catch (error) {
    console.error('Failed to run policy acknowledgement reminders cron:', error);
  }
}

async function recalculateScoresPlaceholder() {
  console.log('[CRON JOB] Recalculating department scoring rollups...');
}

export function startScheduler() {
  cron.schedule('0 1 * * *', async () => {
    await flagOverdueComplianceIssues();
  });

  cron.schedule('0 2 * * *', async () => {
    await sendPolicyAcknowledgementReminders();
  });

  cron.schedule('0 3 * * *', async () => {
    await recalculateScoresPlaceholder();
  });
}
