import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const rewardStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']);

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  pointsRequired: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  status: rewardStatusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.reward.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.reward.count({ where })
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
  const item = await prisma.reward.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Reward not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { name, description, pointsRequired, stock, status } = req.body;

  const newReward = await prisma.reward.create({
    data: { name, description, pointsRequired, stock, status }
  });

  res.status(201).json(newReward);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.reward.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Reward not found');
  }

  const { name, description, pointsRequired, stock, status } = req.body;

  const updatedReward = await prisma.reward.update({
    where: { id },
    data: { name, description, pointsRequired, stock, status }
  });

  res.json(updatedReward);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.reward.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Reward not found');
  }

  const deletedReward = await prisma.reward.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });

  res.json({ message: 'Reward soft deleted successfully', data: deletedReward });
}));

export default router;
