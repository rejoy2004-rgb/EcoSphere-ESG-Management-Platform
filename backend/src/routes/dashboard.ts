import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/environmental', authenticateJWT, async (req, res) => {
  try {
    const transactions = await prisma.carbonTransaction.findMany({
      include: { department: true }
    });
    let totalEmissions = 0;
    const deptMap: Record<string, number> = {};
    const periodMap: Record<string, number> = {};
    for (const t of transactions) {
      const co2e = Number(t.calculatedCO2e);
      totalEmissions += co2e;
      const deptName = t.department?.name || 'Unassigned';
      deptMap[deptName] = (deptMap[deptName] || 0) + co2e;
      const period = t.transactionDate.toISOString().slice(0, 7);
      periodMap[period] = (periodMap[period] || 0) + co2e;
    }
    const emissionsByDepartment = Object.entries(deptMap).map(([name, co2e]) => ({
      departmentName: name,
      co2e
    }));
    const emissionsTrend = Object.entries(periodMap)
      .map(([period, co2e]) => ({ period, co2e }))
      .sort((a, b) => a.period.localeCompare(b.period));
    const goals = await prisma.environmentalGoal.findMany({
      include: { department: true }
    });
    res.json({
      totalEmissions,
      emissionsByDepartment,
      emissionsTrend,
      goalProgress: goals.map(g => ({
        id: g.id,
        title: g.title,
        targetValue: Number(g.targetValue),
        currentValue: Number(g.currentValue),
        unit: g.unit,
        status: g.status,
        departmentName: g.department?.name || 'All Departments'
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/diversity', authenticateJWT, async (req, res) => {
  try {
    const records = await prisma.diversityRecord.findMany();
    const gender: Record<string, number> = {};
    const ageBand: Record<string, number> = {};
    const nationality: Record<string, number> = {};
    for (const r of records) {
      gender[r.gender] = (gender[r.gender] || 0) + 1;
      ageBand[r.ageBand] = (ageBand[r.ageBand] || 0) + 1;
      nationality[r.nationality] = (nationality[r.nationality] || 0) + 1;
    }
    res.json({ gender, ageBand, nationality });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/training-completion', authenticateJWT, async (req, res) => {
  try {
    const records = await prisma.trainingRecord.findMany({
      include: {
        employee: {
          include: { department: true }
        }
      }
    });
    if (records.length === 0) {
      return res.json({ overall: 0, byDepartment: [] });
    }
    const completed = records.filter((r) => r.status === 'COMPLETED').length;
    const overall = (completed / records.length) * 100;
    const deptMap: Record<string, { total: number; completed: number }> = {};
    for (const r of records) {
      const deptName = r.employee?.department?.name || 'Unassigned';
      if (!deptMap[deptName]) {
        deptMap[deptName] = { total: 0, completed: 0 };
      }
      deptMap[deptName].total++;
      if (r.status === 'COMPLETED') {
        deptMap[deptName].completed++;
      }
    }
    const byDepartment = Object.entries(deptMap).map(([name, val]) => ({
      departmentName: name,
      completionRate: (val.completed / val.total) * 100
    }));
    res.json({ overall, byDepartment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/social', authenticateJWT, async (req, res) => {
  try {
    const totalEmployees = await prisma.user.count({
      where: { role: { not: 'ADMIN' } }
    });
    const participatingEmployees = await prisma.user.count({
      where: {
        role: { not: 'ADMIN' },
        csrParticipations: {
          some: { approvalStatus: 'APPROVED' }
        }
      }
    });
    const csrParticipationRate = totalEmployees > 0 ? (participatingEmployees / totalEmployees) * 100 : 0;
    const records = await prisma.diversityRecord.findMany();
    const gender: Record<string, number> = {};
    const ageBand: Record<string, number> = {};
    const nationality: Record<string, number> = {};
    for (const r of records) {
      gender[r.gender] = (gender[r.gender] || 0) + 1;
      ageBand[r.ageBand] = (ageBand[r.ageBand] || 0) + 1;
      nationality[r.nationality] = (nationality[r.nationality] || 0) + 1;
    }
    const diversitySummary = { gender, ageBand, nationality };
    const trainingRecords = await prisma.trainingRecord.findMany();
    let trainingCompletionRate = 0;
    if (trainingRecords.length > 0) {
      const completedTrainings = trainingRecords.filter((t) => t.status === 'COMPLETED').length;
      trainingCompletionRate = (completedTrainings / trainingRecords.length) * 100;
    }
    const activities = await prisma.cSRActivity.findMany({
      include: {
        participations: {
          where: { approvalStatus: 'APPROVED' }
        }
      }
    });
    const topActivities = activities
      .map((a) => ({
        id: a.id,
        title: a.title,
        approvedParticipationsCount: a.participations.length
      }))
      .sort((a, b) => b.approvedParticipationsCount - a.approvedParticipationsCount)
      .slice(0, 5);
    res.json({
      csrParticipationRate,
      diversitySummary,
      trainingCompletionRate,
      topActivities
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/governance', authenticateJWT, async (req, res) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    const [totalAcks, ackCount, openIssues, overdueIssues, completedAudits] = await Promise.all([
      prisma.policyAcknowledgement.count(),
      prisma.policyAcknowledgement.count({ where: { status: 'ACKNOWLEDGED' } }),
      prisma.complianceIssue.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
      }),
      prisma.complianceIssue.count({
        where: {
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.audit.count({
        where: {
          status: 'COMPLETED',
          ...(from || to ? {
            endDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {})
            }
          } : {})
        }
      })
    ]);

    const policyAcknowledgementRate = totalAcks > 0 ? (ackCount / totalAcks) * 100 : 0;

    res.json({
      policyAcknowledgementRate,
      openComplianceIssues: openIssues,
      overdueComplianceIssues: overdueIssues,
      auditsCompletedThisPeriod: completedAudits
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
