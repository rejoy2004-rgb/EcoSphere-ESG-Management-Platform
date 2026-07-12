import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/errors';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { persistDepartmentScore } from '../services/scoring';
import { deriveGoalStatus } from '../utils/calculations';

const router = Router();

router.post('/recalculate', authenticateJWT, requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { departmentId, period } = req.body;
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targetPeriod = period || currentPeriod;

  let departmentsToRecalculate = [];
  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    departmentsToRecalculate.push(dept);
  } else {
    departmentsToRecalculate = await prisma.department.findMany();
  }

  const results = [];
  for (const dept of departmentsToRecalculate) {
    const score = await persistDepartmentScore(dept.id, targetPeriod);
    results.push(score);
  }

  const goals = await prisma.environmentalGoal.findMany();
  for (const goal of goals) {
    const where: any = {};
    if (goal.departmentId) {
      where.departmentId = goal.departmentId;
    }
    const txs = await prisma.carbonTransaction.findMany({
      where,
      include: { emissionFactor: true }
    });

    const isCarbonMetric = goal.unit.toLowerCase().includes('co2') || goal.metricType.toLowerCase().includes('co2') || goal.unit.toLowerCase().includes('carbon');
    let total = 0;
    for (const tx of txs) {
      const txUnit = tx.emissionFactor?.unit || '';
      if (txUnit.toLowerCase() === goal.unit.toLowerCase() || txUnit.toLowerCase() === goal.metricType.toLowerCase() || isCarbonMetric) {
        total += isCarbonMetric ? Number(tx.calculatedCO2e) : Number(tx.quantity);
      }
    }

    const newStatus = deriveGoalStatus(
      total,
      Number(goal.targetValue),
      goal.startDate,
      goal.targetDate,
      new Date()
    );

    await prisma.environmentalGoal.update({
      where: { id: goal.id },
      data: {
        currentValue: total.toString(),
        status: newStatus
      }
    });
  }

  res.json({
    message: 'ESG scores and sustainability goals recalculated successfully',
    period: targetPeriod,
    results
  });
}));

export default router;
