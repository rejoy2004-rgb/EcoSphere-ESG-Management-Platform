import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);
const activityTypeEnum = z.enum(['PURCHASE', 'MANUFACTURING', 'EXPENSE', 'FLEET']);

const createSchema = z.object({
  activityType: activityTypeEnum,
  unit: z.string().min(1),
  co2eFactor: z.number().nonnegative(),
  source: z.string().nullable().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().nullable().optional(),
  status: statusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const activityType = req.query.activityType as string;
  const unit = req.query.unit as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (activityType) {
    where.activityType = activityType;
  }
  if (unit) {
    where.unit = { contains: unit, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.emissionFactor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.emissionFactor.count({ where })
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
  const item = await prisma.emissionFactor.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Emission factor not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { activityType, unit, co2eFactor, source, validFrom, validTo, status } = req.body;

  const newFactor = await prisma.emissionFactor.create({
    data: {
      activityType,
      unit,
      co2eFactor: co2eFactor.toString(),
      source: source || null,
      validFrom: new Date(validFrom),
      validTo: validTo ? new Date(validTo) : null,
      status
    }
  });

  res.status(201).json(newFactor);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.emissionFactor.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Emission factor not found');
  }

  const { activityType, unit, co2eFactor, source, validFrom, validTo, status } = req.body;

  const updatedFactor = await prisma.emissionFactor.update({
    where: { id },
    data: {
      activityType,
      unit,
      co2eFactor: co2eFactor !== undefined ? co2eFactor.toString() : undefined,
      source: source === undefined ? undefined : (source || null),
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo === undefined ? undefined : (validTo ? new Date(validTo) : null),
      status
    }
  });

  res.json(updatedFactor);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.emissionFactor.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Emission factor not found');
  }

  const deletedFactor = await prisma.emissionFactor.delete({
    where: { id }
  });

  res.json({ message: 'Emission factor hard deleted successfully', data: deletedFactor });
}));

export default router;
