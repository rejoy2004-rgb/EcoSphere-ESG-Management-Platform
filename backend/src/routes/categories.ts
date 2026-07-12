import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);
const typeEnum = z.enum(['CSR_ACTIVITY', 'CHALLENGE']);

const createSchema = z.object({
  name: z.string().min(1),
  type: typeEnum,
  status: statusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const type = req.query.type as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.category.count({ where })
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
  const item = await prisma.category.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { name, type, status } = req.body;

  const newCategory = await prisma.category.create({
    data: { name, type, status }
  });

  res.status(201).json(newCategory);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.category.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  const { name, type, status } = req.body;

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { name, type, status }
  });

  res.json(updatedCategory);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.category.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found');
  }

  const deletedCategory = await prisma.category.delete({
    where: { id }
  });

  res.json({ message: 'Category hard deleted successfully', data: deletedCategory });
}));

export default router;
