import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);

const createSchema = z.object({
  productName: z.string().min(1),
  carbonFootprintPerUnit: z.number().nonnegative(),
  sustainabilityRating: z.string().nullable().optional(),
  materialComposition: z.string().nullable().optional(),
  certifications: z.array(z.string()),
  status: statusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const productName = req.query.productName as string;
  const sustainabilityRating = req.query.sustainabilityRating as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (productName) {
    where.productName = { contains: productName, mode: 'insensitive' };
  }
  if (sustainabilityRating) {
    where.sustainabilityRating = { contains: sustainabilityRating, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.productESGProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productESGProfile.count({ where })
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
  const item = await prisma.productESGProfile.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { productName, carbonFootprintPerUnit, sustainabilityRating, materialComposition, certifications, status } = req.body;

  const newProfile = await prisma.productESGProfile.create({
    data: {
      productName,
      carbonFootprintPerUnit: carbonFootprintPerUnit.toString(),
      sustainabilityRating: sustainabilityRating || null,
      materialComposition: materialComposition || null,
      certifications,
      status
    }
  });

  res.status(201).json(newProfile);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.productESGProfile.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
  }

  const { productName, carbonFootprintPerUnit, sustainabilityRating, materialComposition, certifications, status } = req.body;

  const updatedProfile = await prisma.productESGProfile.update({
    where: { id },
    data: {
      productName,
      carbonFootprintPerUnit: carbonFootprintPerUnit !== undefined ? carbonFootprintPerUnit.toString() : undefined,
      sustainabilityRating: sustainabilityRating === undefined ? undefined : (sustainabilityRating || null),
      materialComposition: materialComposition === undefined ? undefined : (materialComposition || null),
      certifications,
      status
    }
  });

  res.json(updatedProfile);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.productESGProfile.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
  }

  const deletedProfile = await prisma.productESGProfile.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });

  res.json({ message: 'Product ESG profile soft deleted successfully', data: deletedProfile });
}));

export default router;
