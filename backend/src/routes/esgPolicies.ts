import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const categoryEnum = z.enum(['ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE']);
const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: categoryEnum,
  version: z.string().min(1),
  effectiveDate: z.string().datetime(),
  attachmentUrl: z.string().nullable().optional(),
  mandatoryAcknowledgement: z.boolean().optional(),
  status: statusEnum
});

const updateSchema = createSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const category = req.query.category as string;
  const version = req.query.version as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (category) {
    where.category = category;
  }
  if (version) {
    where.version = { contains: version, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.eSGPolicy.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.eSGPolicy.count({ where })
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
  const item = await prisma.eSGPolicy.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'ESG Policy not found');
  }
  res.json(item);
}));

router.post('/', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { title, description, category, version, effectiveDate, attachmentUrl, mandatoryAcknowledgement, status } = req.body;

  const newPolicy = await prisma.eSGPolicy.create({
    data: {
      title,
      description,
      category,
      version,
      effectiveDate: new Date(effectiveDate),
      attachmentUrl: attachmentUrl || null,
      mandatoryAcknowledgement: mandatoryAcknowledgement ?? true,
      status
    }
  });

  res.status(201).json(newPolicy);
}));

router.put('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.eSGPolicy.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'ESG Policy not found');
  }

  const { title, description, category, version, effectiveDate, attachmentUrl, mandatoryAcknowledgement, status } = req.body;

  const updatedPolicy = await prisma.eSGPolicy.update({
    where: { id },
    data: {
      title,
      description,
      category,
      version,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      attachmentUrl: attachmentUrl === undefined ? undefined : (attachmentUrl || null),
      mandatoryAcknowledgement,
      status
    }
  });

  res.json(updatedPolicy);
}));

router.delete('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.eSGPolicy.findUnique({ where: { id } });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'ESG Policy not found');
  }

  const deletedPolicy = await prisma.eSGPolicy.update({
    where: { id },
    data: { status: 'ARCHIVED' }
  });

  res.json({ message: 'ESG Policy soft deleted successfully', data: deletedPolicy });
}));

router.patch('/:id/publish', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const policy = await prisma.eSGPolicy.findUnique({ where: { id } });
  if (!policy) {
    throw new AppError(404, 'NOT_FOUND', 'ESG Policy not found');
  }

  const updatedPolicy = await prisma.eSGPolicy.update({
    where: { id },
    data: { status: 'PUBLISHED' }
  });

  if (policy.status !== 'PUBLISHED' && policy.mandatoryAcknowledgement) {
    const users = await prisma.user.findMany();
    const ackData = users.map((user) => ({
      employeeId: user.id,
      policyId: policy.id,
      status: 'PENDING' as const
    }));
    if (ackData.length > 0) {
      await prisma.policyAcknowledgement.createMany({
        data: ackData,
        skipDuplicates: true
      });
    }
  }

  res.json(updatedPolicy);
}));

router.get('/:id/acknowledgements', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const policy = await prisma.eSGPolicy.findUnique({ where: { id } });
  if (!policy) {
    throw new AppError(404, 'NOT_FOUND', 'ESG Policy not found');
  }

  const acks = await prisma.policyAcknowledgement.findMany({
    where: { policyId: id },
    include: { employee: true }
  });

  res.json(acks);
}));

export default router;
