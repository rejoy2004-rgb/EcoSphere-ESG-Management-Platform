"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const categoryEnum = zod_1.z.enum(['ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE']);
const statusEnum = zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    category: categoryEnum,
    version: zod_1.z.string().min(1),
    effectiveDate: zod_1.z.string().datetime(),
    attachmentUrl: zod_1.z.string().nullable().optional(),
    mandatoryAcknowledgement: zod_1.z.boolean().optional(),
    status: statusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const category = req.query.category;
    const version = req.query.version;
    const where = {};
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
        prisma_1.prisma.eSGPolicy.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.eSGPolicy.count({ where })
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
    const item = await prisma_1.prisma.eSGPolicy.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'ESG Policy not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { title, description, category, version, effectiveDate, attachmentUrl, mandatoryAcknowledgement, status } = req.body;
    const newPolicy = await prisma_1.prisma.eSGPolicy.create({
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
router.put('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.eSGPolicy.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'ESG Policy not found');
    }
    const { title, description, category, version, effectiveDate, attachmentUrl, mandatoryAcknowledgement, status } = req.body;
    const updatedPolicy = await prisma_1.prisma.eSGPolicy.update({
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
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.eSGPolicy.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'ESG Policy not found');
    }
    const deletedPolicy = await prisma_1.prisma.eSGPolicy.update({
        where: { id },
        data: { status: 'ARCHIVED' }
    });
    res.json({ message: 'ESG Policy soft deleted successfully', data: deletedPolicy });
}));
exports.default = router;
