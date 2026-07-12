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
  const userRole = req.headers['x-user-role'] as string;

  const where: any = {};
  if (userRole === 'EMPLOYEE' || !userRole) {
    where.status = 'ACTIVE';
  } else if (status) {
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

const getEmployeeId = (req: any): string => {
  const headerId = req.headers['x-user-id'] || req.headers['x-employee-id'];
  const finalId = req.user?.id || (Array.isArray(headerId) ? headerId[0] : headerId);
  if (!finalId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Employee identification is required');
  }
  return finalId as string;
};

router.post('/:id/redeem', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = getEmployeeId(req);

  const reward = await prisma.reward.findUnique({ where: { id } });
  if (!reward) {
    throw new AppError(404, 'NOT_FOUND', 'Reward not found');
  }

  if (reward.stock <= 0) {
    throw new AppError(400, 'BAD_REQUEST', 'Reward is out of stock');
  }

  const user = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!user) {
    throw new AppError(400, 'BAD_REQUEST', 'Employee not found');
  }

  if (user.pointsBalance < reward.pointsRequired) {
    throw new AppError(400, 'BAD_REQUEST', 'Insufficient points balance');
  }

  const nextStock = reward.stock - 1;
  const nextStatus = nextStock === 0 ? 'OUT_OF_STOCK' : reward.status;

  const [redemption] = await prisma.$transaction([
    prisma.redemption.create({
      data: {
        employeeId,
        rewardId: id
      }
    }),
    prisma.reward.update({
      where: { id },
      data: {
        stock: nextStock,
        status: nextStatus
      }
    }),
    prisma.pointsLedgerEntry.create({
      data: {
        employeeId,
        delta: -reward.pointsRequired,
        reason: 'REWARD_REDEMPTION',
        referenceId: id
      }
    }),
    prisma.user.update({
      where: { id: employeeId },
      data: {
        pointsBalance: {
          decrement: reward.pointsRequired
        }
      }
    })
  ]);

  console.log(`[Notification Stub] Employee ${employeeId} redeemed reward ${reward.name}!`);

  res.json(redemption);
}));

export default router;
