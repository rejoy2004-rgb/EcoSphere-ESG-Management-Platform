import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  headId: z.string().nullable().optional(),
  parentDepartmentId: z.string().nullable().optional(),
  employeeCount: z.number().int().nonnegative().optional(),
  status: statusEnum
});

const updateSchema = createSchema.partial();

interface DepartmentTree {
  id: string;
  name: string;
  code: string;
  headId: string | null;
  parentDepartmentId: string | null;
  employeeCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  children: DepartmentTree[];
}

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const code = req.query.code as string;
  const name = req.query.name as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (code) {
    where.code = code;
  }
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.department.count({ where })
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
  const item = await prisma.department.findUnique({
    where: { id: req.params.id }
  });
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Department not found');
  }
  res.json(item);
}));

router.get('/:id/hierarchy', asyncHandler(async (req, res) => {
  const rootDept = await prisma.department.findUnique({
    where: { id: req.params.id }
  });
  if (!rootDept) {
    throw new AppError(404, 'NOT_FOUND', 'Department not found');
  }

  const allDepts = await prisma.department.findMany();
  const parentToChildren: Record<string, any[]> = {};
  for (const dept of allDepts) {
    if (dept.parentDepartmentId) {
      if (!parentToChildren[dept.parentDepartmentId]) {
        parentToChildren[dept.parentDepartmentId] = [];
      }
      parentToChildren[dept.parentDepartmentId].push(dept);
    }
  }

  const buildTree = (dept: any): DepartmentTree => {
    const children = parentToChildren[dept.id] || [];
    return {
      ...dept,
      children: children.map(buildTree)
    };
  };

  res.json(buildTree(rootDept));
}));

router.post('/', requireRole(['ADMIN']), validateBody(createSchema), asyncHandler(async (req, res) => {
  const { name, code, headId, parentDepartmentId, employeeCount, status } = req.body;

  const existing = await prisma.department.findUnique({
    where: { code }
  });
  if (existing) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Department code must be unique', { code: 'Code already in use' });
  }

  if (parentDepartmentId) {
    const parent = await prisma.department.findUnique({
      where: { id: parentDepartmentId }
    });
    if (!parent) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Parent department not found', { parentDepartmentId: 'Parent department does not exist' });
    }
  }

  const newDept = await prisma.department.create({
    data: {
      name,
      code,
      headId: headId || null,
      parentDepartmentId: parentDepartmentId || null,
      employeeCount: employeeCount ?? 0,
      status
    }
  });

  res.status(201).json(newDept);
}));

router.put('/:id', requireRole(['ADMIN']), validateBody(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new AppError(404, 'NOT_FOUND', 'Department not found');
  }

  const { name, code, headId, parentDepartmentId, employeeCount, status } = req.body;

  if (code && code !== dept.code) {
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Department code must be unique', { code: 'Code already in use' });
    }
  }

  if (parentDepartmentId) {
    if (parentDepartmentId === id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'A department cannot be its own parent', { parentDepartmentId: 'Invalid parent department' });
    }
    const parent = await prisma.department.findUnique({ where: { id: parentDepartmentId } });
    if (!parent) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Parent department not found', { parentDepartmentId: 'Parent department does not exist' });
    }
  }

  const updatedDept = await prisma.department.update({
    where: { id },
    data: {
      name,
      code,
      headId: headId === undefined ? undefined : (headId || null),
      parentDepartmentId: parentDepartmentId === undefined ? undefined : (parentDepartmentId || null),
      employeeCount,
      status
    }
  });

  res.json(updatedDept);
}));

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new AppError(404, 'NOT_FOUND', 'Department not found');
  }

  const deletedDept = await prisma.department.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });

  res.json({ message: 'Department soft deleted successfully', data: deletedDept });
}));

router.get('/:id/carbon', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new AppError(404, 'NOT_FOUND', 'Department not found');
  }

  const txs = await prisma.carbonTransaction.findMany({
    where: { departmentId: id },
    orderBy: { transactionDate: 'asc' }
  });

  const dailyEmissions: Record<string, number> = {};
  for (const tx of txs) {
    const dateStr = tx.transactionDate.toISOString().split('T')[0];
    dailyEmissions[dateStr] = (dailyEmissions[dateStr] || 0) + Number(tx.calculatedCO2e);
  }

  const data = Object.keys(dailyEmissions).map((date) => ({
    date,
    co2e: dailyEmissions[date]
  }));

  res.json(data);
}));

export default router;
