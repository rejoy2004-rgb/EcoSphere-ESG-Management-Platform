"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const statusEnum = zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const severityEnum = zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const createSchema = zod_1.z.object({
    auditId: zod_1.z.string().nullable().optional(),
    severity: severityEnum,
    description: zod_1.z.string().min(1),
    ownerId: zod_1.z.string().min(1),
    dueDate: zod_1.z.string().datetime(),
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
    const severity = req.query.severity;
    const ownerId = req.query.ownerId;
    const auditId = req.query.auditId;
    const overdue = req.query.overdue === 'true';
    const where = {};
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
        prisma_1.prisma.complianceIssue.findMany({
            where,
            skip,
            take: limit,
            orderBy: { dueDate: 'asc' }
        }),
        prisma_1.prisma.complianceIssue.count({ where })
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
    const issue = await prisma_1.prisma.complianceIssue.findUnique({
        where: { id },
        include: { audit: true, owner: true }
    });
    if (!issue) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Compliance issue not found');
    }
    res.json(issue);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { auditId, severity, description, ownerId, dueDate, status } = req.body;
    if (auditId) {
        const audit = await prisma_1.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Audit not found', { auditId: 'Audit does not exist' });
        }
    }
    const owner = await prisma_1.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Owner not found', { ownerId: 'Owner does not exist' });
    }
    const newIssue = await prisma_1.prisma.complianceIssue.create({
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
router.put('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const issue = await prisma_1.prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Compliance issue not found');
    }
    const { auditId, severity, description, ownerId, dueDate, status } = req.body;
    if (auditId) {
        const audit = await prisma_1.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Audit not found', { auditId: 'Audit does not exist' });
        }
    }
    if (ownerId) {
        const owner = await prisma_1.prisma.user.findUnique({ where: { id: ownerId } });
        if (!owner) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Owner not found', { ownerId: 'Owner does not exist' });
        }
    }
    const updatedIssue = await prisma_1.prisma.complianceIssue.update({
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
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const issue = await prisma_1.prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Compliance issue not found');
    }
    const deletedIssue = await prisma_1.prisma.complianceIssue.delete({ where: { id } });
    res.json({ message: 'Compliance issue deleted successfully', data: deletedIssue });
}));
router.patch('/:id/status', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(statusUpdateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const issue = await prisma_1.prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Compliance issue not found');
    }
    const updatedIssue = await prisma_1.prisma.complianceIssue.update({
        where: { id },
        data: { status }
    });
    res.json(updatedIssue);
}));
exports.default = router;
