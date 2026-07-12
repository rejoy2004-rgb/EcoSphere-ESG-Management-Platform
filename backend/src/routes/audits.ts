import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']);

const createSchema = z.object({
  title: z.string().min(1),
  departmentId: z.string().nullable().optional(),
  auditorId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  findingsSummary: z.string().nullable().optional(),
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
  const auditorId = req.query.auditorId as string;
  const departmentId = req.query.departmentId as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (auditorId) {
    where.auditorId = auditorId;
  }
  if (departmentId) {
    where.departmentId = departmentId;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.audit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.audit.count({ where })
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
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: { department: true, auditor: true, complianceIssues: true }
  });
  if (!audit) {
    throw new AppError(404, 'NOT_FOUND', 'Audit not found');
  }
  res.json(audit);
}));

router.post('/', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { title, departmentId, auditorId, startDate, endDate, findingsSummary, status } = req.body;

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
    }
  }

  const auditor = await prisma.user.findUnique({ where: { id: auditorId } });
  if (!auditor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Auditor not found', { auditorId: 'Auditor does not exist' });
  }

  const newAudit = await prisma.audit.create({
    data: {
      title,
      departmentId: departmentId || null,
      auditorId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      findingsSummary: findingsSummary || null,
      status: status || 'PLANNED'
    }
  });

  res.status(201).json(newAudit);
}));

router.put('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    throw new AppError(404, 'NOT_FOUND', 'Audit not found');
  }

  const { title, departmentId, auditorId, startDate, endDate, findingsSummary, status } = req.body;

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
    }
  }

  if (auditorId) {
    const auditor = await prisma.user.findUnique({ where: { id: auditorId } });
    if (!auditor) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Auditor not found', { auditorId: 'Auditor does not exist' });
    }
  }

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: {
      title,
      departmentId: departmentId === undefined ? undefined : (departmentId || null),
      auditorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate === undefined ? undefined : (endDate ? new Date(endDate) : null),
      findingsSummary: findingsSummary === undefined ? undefined : (findingsSummary || null),
      status
    }
  });

  res.json(updatedAudit);
}));

router.delete('/:id', requireRole(['ADMIN', 'ESG_MANAGER']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    throw new AppError(404, 'NOT_FOUND', 'Audit not found');
  }

  const deletedAudit = await prisma.audit.delete({ where: { id } });
  res.json({ message: 'Audit deleted successfully', data: deletedAudit });
}));

router.patch('/:id/status', requireRole(['ADMIN', 'ESG_MANAGER']), validateBody(statusUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    throw new AppError(404, 'NOT_FOUND', 'Audit not found');
  }

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: { status }
  });

  res.json(updatedAudit);
}));

export default router;
