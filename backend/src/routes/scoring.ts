import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/errors';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { persistDepartmentScore } from '../services/scoring';

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

  res.json({
    message: 'ESG scores recalculated successfully',
    period: targetPeriod,
    results
  });
}));

export default router;
