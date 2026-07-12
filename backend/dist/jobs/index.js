"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const scoring_1 = require("../services/scoring");
const prisma = new client_1.PrismaClient();
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
            await (0, notificationService_1.sendNotification)(issue.ownerId, 'COMPLIANCE_OVERDUE', `Your compliance issue: "${issue.description}" is overdue. Due date was ${issue.dueDate.toISOString().split('T')[0]}.`);
            for (const manager of esgManagers) {
                await (0, notificationService_1.sendNotification)(manager.id, 'COMPLIANCE_OVERDUE_ALERT', `Compliance issue assigned to ${issue.owner.name} ("${issue.description}") is overdue.`);
            }
        }
    }
    catch (error) {
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
            await (0, notificationService_1.sendNotification)(ack.employeeId, 'POLICY_REMINDER', `Acknowledgement reminder: Please review and sign the policy "${ack.policy.title}".`);
        }
    }
    catch (error) {
        console.error('Failed to run policy acknowledgement reminders cron:', error);
    }
}
async function recalculateScoresJob() {
    try {
        const departments = await prisma.department.findMany();
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        for (const dept of departments) {
            await (0, scoring_1.persistDepartmentScore)(dept.id, period);
        }
        console.log('[CRON JOB] Recalculated department scoring rollups for period:', period);
    }
    catch (error) {
        console.error('Failed to recalculate scoring rollups cron:', error);
    }
}
function startScheduler() {
    node_cron_1.default.schedule('0 1 * * *', async () => {
        await flagOverdueComplianceIssues();
    });
    node_cron_1.default.schedule('0 2 * * *', async () => {
        await sendPolicyAcknowledgementReminders();
    });
    node_cron_1.default.schedule('0 3 * * *', async () => {
        await recalculateScoresJob();
    });
}
