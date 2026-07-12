"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const statusEnum = zod_1.z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']);
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    departmentId: zod_1.z.string().nullable().optional(),
    auditorId: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().nullable().optional(),
    findingsSummary: zod_1.z.string().nullable().optional(),
    status: statusEnum.optional()
});
const updateSchema = createSchema.partial();
const statusUpdateSchema = zod_1.z.object({
    status: statusEnum
});
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const auditorId = req.query.auditorId;
    const departmentId = req.query.departmentId;
    const where = {};
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
        prisma_1.prisma.audit.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.audit.count({ where })
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
    const { id } = req.params;
    const audit = await prisma_1.prisma.audit.findUnique({
        where: { id },
        include: { department: true, auditor: true, complianceIssues: true }
    });
    if (!audit) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Audit not found');
    }
    res.json(audit);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { title, departmentId, auditorId, startDate, endDate, findingsSummary, status } = req.body;
    if (departmentId) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
        }
    }
    const auditor = await prisma_1.prisma.user.findUnique({ where: { id: auditorId } });
    if (!auditor) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Auditor not found', { auditorId: 'Auditor does not exist' });
    }
    const newAudit = await prisma_1.prisma.audit.create({
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
router.put('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const audit = await prisma_1.prisma.audit.findUnique({ where: { id } });
    if (!audit) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Audit not found');
    }
    const { title, departmentId, auditorId, startDate, endDate, findingsSummary, status } = req.body;
    if (departmentId) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
        }
    }
    if (auditorId) {
        const auditor = await prisma_1.prisma.user.findUnique({ where: { id: auditorId } });
        if (!auditor) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Auditor not found', { auditorId: 'Auditor does not exist' });
        }
    }
    const updatedAudit = await prisma_1.prisma.audit.update({
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
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const audit = await prisma_1.prisma.audit.findUnique({ where: { id } });
    if (!audit) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Audit not found');
    }
    const deletedAudit = await prisma_1.prisma.audit.delete({ where: { id } });
    res.json({ message: 'Audit deleted successfully', data: deletedAudit });
}));
router.patch('/:id/status', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(statusUpdateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const audit = await prisma_1.prisma.audit.findUnique({ where: { id } });
    if (!audit) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Audit not found');
    }
    const updatedAudit = await prisma_1.prisma.audit.update({
        where: { id },
        data: { status }
    });
    res.json(updatedAudit);
}));
exports.default = router;
