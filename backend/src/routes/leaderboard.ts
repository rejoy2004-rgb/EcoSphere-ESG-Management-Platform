import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/errors';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const scope = req.query.scope as string || 'org';
  const departmentId = req.query.departmentId as string;
  const period = req.query.period as string || 'all';

  const now = new Date();
  const where: any = {
    delta: { gt: 0 }
  };

  if (scope === 'department' && departmentId) {
    where.employee = { departmentId };
  }

  if (period === 'week') {
    where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (period === 'month') {
    where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  } else if (period === 'quarter') {
    where.createdAt = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
  }

  const entries = await prisma.pointsLedgerEntry.findMany({
    where,
    include: {
      employee: {
        include: { department: true }
      }
    }
  });

  const userPoints: Record<string, { name: string; departmentName: string; points: number }> = {};
  for (const entry of entries) {
    const emp = entry.employee;
    if (!userPoints[entry.employeeId]) {
      userPoints[entry.employeeId] = {
        name: emp.name,
        departmentName: emp.department?.name || 'Unassigned',
        points: 0
      };
    }
    userPoints[entry.employeeId].points += entry.delta;
  }

  const ranked = Object.entries(userPoints)
    .map(([id, val]) => ({
      id,
      name: val.name,
      department: val.departmentName,
      points: val.points
    }))
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({
      rank: index + 1,
      ...user
    }));

  res.json(ranked);
}));

export default router;
