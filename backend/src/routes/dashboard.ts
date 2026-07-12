import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/errors';

const router = Router();

router.get('/environmental', asyncHandler(async (req, res) => {
  const from = req.query.from as string;
  const to = req.query.to as string;

  const where: any = {};
  if (from || to) {
    where.transactionDate = {};
    if (from) {
      where.transactionDate.gte = new Date(from);
    }
    if (to) {
      where.transactionDate.lte = new Date(to);
    }
  }

  const [txs, depts, goals] = await Promise.all([
    prisma.carbonTransaction.findMany({ where }),
    prisma.department.findMany(),
    prisma.environmentalGoal.findMany()
  ]);

  let totalEmissions = 0;
  const dailyEmissions: Record<string, number> = {};
  const deptEmissions: Record<string, number> = {};

  for (const tx of txs) {
    const co2e = Number(tx.calculatedCO2e);
    totalEmissions += co2e;

    const dateStr = tx.transactionDate.toISOString().split('T')[0];
    dailyEmissions[dateStr] = (dailyEmissions[dateStr] || 0) + co2e;

    deptEmissions[tx.departmentId] = (deptEmissions[tx.departmentId] || 0) + co2e;
  }

  const emissionsTrend = Object.keys(dailyEmissions)
    .sort()
    .map((date) => ({
      date,
      co2e: dailyEmissions[date]
    }));

  const deptMap = new Map(depts.map((d) => [d.id, d.name]));
  const emissionsByDepartment = Object.keys(deptEmissions).map((deptId) => ({
    departmentId: deptId,
    departmentName: deptMap.get(deptId) || 'Unknown',
    co2e: deptEmissions[deptId]
  }));

  const goalsProgress = {
    achieved: 0,
    onTrack: 0,
    atRisk: 0,
    missed: 0
  };

  for (const goal of goals) {
    const status = goal.status.toUpperCase();
    if (status === 'ACHIEVED') {
      goalsProgress.achieved++;
    } else if (status === 'ON_TRACK') {
      goalsProgress.onTrack++;
    } else if (status === 'AT_RISK') {
      goalsProgress.atRisk++;
    } else if (status === 'MISSED') {
      goalsProgress.missed++;
    }
  }

  res.json({
    totalEmissions,
    emissionsTrend,
    emissionsByDepartment,
    goalsProgress
  });
}));

export default router;
