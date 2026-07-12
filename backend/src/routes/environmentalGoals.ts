import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { deriveGoalStatus } from '../utils/calculations';


const router = Router();

const goalStatusEnum = z.enum(['ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED']);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  metricType: z.string().min(1),
  targetValue: z.number().nonnegative(),
  currentValue: z.number().nonnegative().optional(),
  unit: z.string().min(1),
  startDate: z.string().datetime(),
  targetDate: z.string().datetime(),
  status: goalStatusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const departmentId = req.query.departmentId as string;
  const metricType = req.query.metricType as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (departmentId) {
    where.departmentId = departmentId;
  }
  if (metricType) {
    where.metricType = { contains: metricType, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.environmentalGoal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.environmentalGoal.count({ where })
  ]);

  res.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await prisma.environmentalGoal.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Environmental goal not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { title, description, departmentId, metricType, targetValue, currentValue, unit, startDate, targetDate, status } = req.body;

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
    }
  }

  const newGoal = await prisma.environmentalGoal.create({
    data: {
      title,
      description: description || null,
      departmentId: departmentId || null,
      metricType,
      targetValue: targetValue.toString(),
      currentValue: (currentValue ?? 0).toString(),
      unit,
      startDate: new Date(startDate),
      targetDate: new Date(targetDate),
      status
    }
  });

  res.status(201).json(newGoal);
}));

router.put('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.environmentalGoal.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Environmental goal not found');
  }

  const { title, description, departmentId, metricType, targetValue, currentValue, unit, startDate, targetDate, status } = req.body;

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
    }
  }

  const updatedGoal = await prisma.environmentalGoal.update({
    where: { id },
    data: {
      title,
      description: description === undefined ? undefined : (description || null),
      departmentId: departmentId === undefined ? undefined : (departmentId || null),
      metricType,
      targetValue: targetValue !== undefined ? targetValue.toString() : undefined,
      currentValue: currentValue !== undefined ? currentValue.toString() : undefined,
      unit,
      startDate: startDate ? new Date(startDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status
    }
  });

  res.json(updatedGoal);
}));

router.delete('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.environmentalGoal.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Environmental goal not found');
  }

  const deletedGoal = await prisma.environmentalGoal.delete({
    where: { id }
  });

  res.json({ message: 'Environmental goal hard deleted successfully', data: deletedGoal });
}));

router.patch('/:id/recalculate', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await prisma.environmentalGoal.findUnique({ where: { id } });
  if (!goal) {
    throw new AppError(404, 'NOT_FOUND', 'Environmental goal not found');
  }

  const where: any = {};
  if (goal.departmentId) {
    where.departmentId = goal.departmentId;
  }

  const txs = await prisma.carbonTransaction.findMany({
    where,
    include: { emissionFactor: true }
  });

  const isCarbonMetric = goal.unit.toLowerCase().includes('co2') || goal.metricType.toLowerCase().includes('co2');
  let total = 0;
  for (const tx of txs) {
    const txUnit = tx.emissionFactor.unit;
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

  const updatedGoal = await prisma.environmentalGoal.update({
    where: { id },
    data: {
      currentValue: total.toString(),
      status: newStatus
    }
  });

  res.json(updatedGoal);
}));

export default router;
