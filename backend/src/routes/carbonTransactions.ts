import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { calculateCO2e } from '../utils/calculations';

const router = Router();

const sourceTypeEnum = z.enum(['PURCHASE', 'MANUFACTURING', 'EXPENSE', 'FLEET']);

const createSchema = z.object({
  departmentId: z.string().min(1),
  sourceType: sourceTypeEnum,
  quantity: z.number().positive(),
  unit: z.string().min(1),
  co2eFactor: z.number().nonnegative().optional(),
  transactionDate: z.string().datetime(),
  description: z.string().nullable().optional(),
  createdById: z.string().nullable().optional()
});

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const departmentId = req.query.departmentId as string;
  const from = req.query.from as string;
  const to = req.query.to as string;
  const sourceType = req.query.sourceType as string;

  const where: any = {};
  if (departmentId) {
    where.departmentId = departmentId;
  }
  if (sourceType) {
    where.sourceType = sourceType;
  }
  if (from || to) {
    where.transactionDate = {};
    if (from) {
      where.transactionDate.gte = new Date(from);
    }
    if (to) {
      where.transactionDate.lte = new Date(to);
    }
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.carbonTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { transactionDate: 'desc' }
    }),
    prisma.carbonTransaction.count({ where })
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

router.get('/summary', asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId as string;
  const from = req.query.from as string;
  const to = req.query.to as string;

  const where: any = {};
  if (departmentId) {
    where.departmentId = departmentId;
  }
  if (from || to) {
    where.transactionDate = {};
    if (from) {
      where.transactionDate.gte = new Date(from);
    }
    if (to) {
      where.transactionDate.lte = new Date(to);
    }
  }

  const txs = await prisma.carbonTransaction.findMany({ where });

  const breakdown: Record<string, number> = {
    PURCHASE: 0,
    MANUFACTURING: 0,
    EXPENSE: 0,
    FLEET: 0
  };

  let totalCO2e = 0;
  for (const tx of txs) {
    const co2e = Number(tx.calculatedCO2e);
    totalCO2e += co2e;
    breakdown[tx.sourceType] = (breakdown[tx.sourceType] || 0) + co2e;
  }

  res.json({
    totalCO2e,
    breakdown
  });
}));

router.post('/', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { departmentId, sourceType, quantity, unit, co2eFactor, transactionDate, description, createdById } = req.body;

  const setting = await prisma.systemSetting.findFirst();
  const autoCalcEnabled = setting ? setting.autoEmissionCalculationEnabled : true;

  if (!autoCalcEnabled && co2eFactor === undefined) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Auto-calculation is disabled. Please provide a manual co2eFactor.', {
      co2eFactor: 'Manual factor required'
    });
  }

  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
  }

  let factor = await prisma.emissionFactor.findFirst({
    where: {
      activityType: sourceType,
      unit,
      status: 'ACTIVE',
      OR: [
        { validFrom: null },
        { validFrom: { lte: new Date(transactionDate) } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  if (co2eFactor === undefined && !factor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No active emission factor found for activity type and unit', {
      sourceType: 'No factor found',
      unit: 'No factor found'
    });
  }

  if (!factor) {
    factor = await prisma.emissionFactor.create({
      data: {
        activityType: sourceType,
        unit,
        co2eFactor: (co2eFactor ?? 0).toString(),
        status: 'ACTIVE'
      }
    });
  }

  const finalFactor = co2eFactor !== undefined ? co2eFactor : Number(factor.co2eFactor);
  const calculated = calculateCO2e(quantity, finalFactor);

  let userId = createdById;
  if (!userId) {
    let systemUser = await prisma.user.findFirst();
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@ecosphere.local',
          passwordHash: 'mock-hash',
          role: 'ADMIN'
        }
      });
    }
    userId = systemUser.id;
  }

  const tx = await prisma.carbonTransaction.create({
    data: {
      departmentId,
      emissionFactorId: factor.id,
      sourceType,
      quantity: quantity.toString(),
      calculatedCO2e: calculated.toString(),
      transactionDate: new Date(transactionDate),
      sourceRecordId: description || null,
      createdById: userId
    }
  });

  res.status(201).json(tx);
}));

export default router;
