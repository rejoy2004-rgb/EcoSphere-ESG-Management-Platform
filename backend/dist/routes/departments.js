"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const statusEnum = zod_1.z.enum(['ACTIVE', 'INACTIVE']);
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().min(1),
    headId: zod_1.z.string().nullable().optional(),
    parentDepartmentId: zod_1.z.string().nullable().optional(),
    employeeCount: zod_1.z.number().int().nonnegative().optional(),
    status: statusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const code = req.query.code;
    const name = req.query.name;
    const where = {};
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
        prisma_1.prisma.department.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.department.count({ where })
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
router.get('/:id', (0, errors_1.asyncHandler)(async (req, res) => {
    const item = await prisma_1.prisma.department.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Department not found');
    }
    res.json(item);
}));
router.get('/:id/hierarchy', (0, errors_1.asyncHandler)(async (req, res) => {
    const rootDept = await prisma_1.prisma.department.findUnique({
        where: { id: req.params.id }
    });
    if (!rootDept) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Department not found');
    }
    const allDepts = await prisma_1.prisma.department.findMany();
    const parentToChildren = {};
    for (const dept of allDepts) {
        if (dept.parentDepartmentId) {
            if (!parentToChildren[dept.parentDepartmentId]) {
                parentToChildren[dept.parentDepartmentId] = [];
            }
            parentToChildren[dept.parentDepartmentId].push(dept);
        }
    }
    const buildTree = (dept) => {
        const children = parentToChildren[dept.id] || [];
        return {
            ...dept,
            children: children.map(buildTree)
        };
    };
    res.json(buildTree(rootDept));
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { name, code, headId, parentDepartmentId, employeeCount, status } = req.body;
    const existing = await prisma_1.prisma.department.findUnique({
        where: { code }
    });
    if (existing) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department code must be unique', { code: 'Code already in use' });
    }
    if (parentDepartmentId) {
        const parent = await prisma_1.prisma.department.findUnique({
            where: { id: parentDepartmentId }
        });
        if (!parent) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Parent department not found', { parentDepartmentId: 'Parent department does not exist' });
        }
    }
    const newDept = await prisma_1.prisma.department.create({
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
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dept = await prisma_1.prisma.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Department not found');
    }
    const { name, code, headId, parentDepartmentId, employeeCount, status } = req.body;
    if (code && code !== dept.code) {
        const existing = await prisma_1.prisma.department.findUnique({ where: { code } });
        if (existing) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department code must be unique', { code: 'Code already in use' });
        }
    }
    if (parentDepartmentId) {
        if (parentDepartmentId === id) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'A department cannot be its own parent', { parentDepartmentId: 'Invalid parent department' });
        }
        const parent = await prisma_1.prisma.department.findUnique({ where: { id: parentDepartmentId } });
        if (!parent) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Parent department not found', { parentDepartmentId: 'Parent department does not exist' });
        }
    }
    const updatedDept = await prisma_1.prisma.department.update({
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
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dept = await prisma_1.prisma.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Department not found');
    }
    const deletedDept = await prisma_1.prisma.department.update({
        where: { id },
        data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Department soft deleted successfully', data: deletedDept });
}));
exports.default = router;
