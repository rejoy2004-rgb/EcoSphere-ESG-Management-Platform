import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const unlockRuleSchema = z.object({
  metric: z.enum(['XP', 'COMPLETED_CHALLENGES', 'CSR_COUNT']),
  operator: z.enum(['>=', '>', '=']),
  value: z.number()
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  unlockRuleJson: unlockRuleSchema,
  iconUrl: z.string().nullable().optional()
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const name = req.query.name as string;

  const where: any = {};
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.badge.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.badge.count({ where })
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
  const item = await prisma.badge.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Badge not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { name, description, unlockRuleJson, iconUrl } = req.body;

  const newBadge = await prisma.badge.create({
    data: {
      name,
      description,
      unlockRuleJson: JSON.stringify(unlockRuleJson),
      iconUrl: iconUrl || null
    }
  });

  res.status(201).json(newBadge);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.badge.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Badge not found');
  }

  const { name, description, unlockRuleJson, iconUrl } = req.body;

  const updatedBadge = await prisma.badge.update({
    where: { id },
    data: {
      name,
      description,
      unlockRuleJson: unlockRuleJson ? JSON.stringify(unlockRuleJson) : undefined,
      iconUrl: iconUrl === undefined ? undefined : (iconUrl || null)
    }
  });

  res.json(updatedBadge);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.badge.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Badge not found');
  }

  const deletedBadge = await prisma.badge.delete({
    where: { id }
  });

  res.json({ message: 'Badge hard deleted successfully', data: deletedBadge });
}));

router.get('/:id/badges', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Employee not found');
  }

  const employeeBadges = await prisma.employeeBadge.findMany({
    where: { employeeId: id },
    include: { badge: true }
  });

  res.json(employeeBadges);
}));

export default router;
