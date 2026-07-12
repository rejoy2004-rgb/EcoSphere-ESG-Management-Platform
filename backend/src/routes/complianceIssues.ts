import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const createSchema = z.object({
  auditId: z.string().nullable().optional(),
  severity: severityEnum,
  description: z.string().min(1),
  ownerId: z.string().min(1),
  dueDate: z.string().datetime(),
  status: statusEnum.optional()
});

const updateSchema = createSchema.partial();

const statusUpdateSchema = z.object({
  status: statusEnum
});

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const severity = req.query.severity as string;
  const ownerId = req.query.ownerId as string;
  const auditId = req.query.auditId as string;
  const overdue = req.query.overdue === 'true';

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (severity) {
    where.severity = severity;
  }
  if (ownerId) {
    where.ownerId = ownerId;
  }
  if (auditId) {
    where.auditId = auditId;
  }
  if (overdue) {
    where.status = { notIn: ['RESOLVED', 'CLOSED'] };
    where.dueDate = { lt: new Date() };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.complianceIssue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: 'asc' }
    }),
    prisma.complianceIssue.count({ where })
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
  const { id } = req.params;
  const issue = await prisma.complianceIssue.findUnique({
    where: { id },
    include: { audit: true, owner: true }
  });
  if (!issue) {
    throw new AppError(404, 'NOT_FOUND', 'Compliance issue not found');
  }
  res.json(issue);
}));

router.post('/', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { auditId, severity, description, ownerId, dueDate, status } = req.body;

  if (auditId) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Audit not found', { auditId: 'Audit does not exist' });
    }
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Owner not found', { ownerId: 'Owner does not exist' });
  }

  const newIssue = await prisma.complianceIssue.create({
    data: {
      auditId: auditId || null,
      severity,
      description,
      ownerId,
      dueDate: new Date(dueDate),
      status: status || 'OPEN'
    }
  });

  res.status(201).json(newIssue);
}));

router.put('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = await prisma.complianceIssue.findUnique({ where: { id } });
  if (!issue) {
    throw new AppError(404, 'NOT_FOUND', 'Compliance issue not found');
  }

  const { auditId, severity, description, ownerId, dueDate, status } = req.body;

  if (auditId) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Audit not found', { auditId: 'Audit does not exist' });
    }
  }

  if (ownerId) {
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Owner not found', { ownerId: 'Owner does not exist' });
    }
  }

  const updatedIssue = await prisma.complianceIssue.update({
    where: { id },
    data: {
      auditId: auditId === undefined ? undefined : (auditId || null),
      severity,
      description,
      ownerId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status
    }
  });

  res.json(updatedIssue);
}));

router.delete('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const issue = await prisma.complianceIssue.findUnique({ where: { id } });
  if (!issue) {
    throw new AppError(404, 'NOT_FOUND', 'Compliance issue not found');
  }

  const deletedIssue = await prisma.complianceIssue.delete({ where: { id } });
  res.json({ message: 'Compliance issue deleted successfully', data: deletedIssue });
}));

router.patch('/:id/status', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const issue = await prisma.complianceIssue.findUnique({ where: { id } });
  if (!issue) {
    throw new AppError(404, 'NOT_FOUND', 'Compliance issue not found');
  }

  const updatedIssue = await prisma.complianceIssue.update({
    where: { id },
    data: { status }
  });

  res.json(updatedIssue);
}));

export default router;
