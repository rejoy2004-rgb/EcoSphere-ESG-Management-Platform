"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const unlockRuleSchema = zod_1.z.object({
    metric: zod_1.z.enum(['XP', 'COMPLETED_CHALLENGES', 'CSR_COUNT']),
    operator: zod_1.z.enum(['>=', '>', '=']),
    value: zod_1.z.number()
});
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    unlockRuleJson: unlockRuleSchema,
    iconUrl: zod_1.z.string().nullable().optional()
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const name = req.query.name;
    const where = {};
    if (name) {
        where.name = { contains: name, mode: 'insensitive' };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.badge.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.badge.count({ where })
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
    const item = await prisma_1.prisma.badge.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Badge not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { name, description, unlockRuleJson, iconUrl } = req.body;
    const newBadge = await prisma_1.prisma.badge.create({
        data: {
            name,
            description,
            unlockRuleJson,
            iconUrl: iconUrl || null
        }
    });
    res.status(201).json(newBadge);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.badge.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Badge not found');
    }
    const { name, description, unlockRuleJson, iconUrl } = req.body;
    const updatedBadge = await prisma_1.prisma.badge.update({
        where: { id },
        data: {
            name,
            description,
            unlockRuleJson,
            iconUrl: iconUrl === undefined ? undefined : (iconUrl || null)
        }
    });
    res.json(updatedBadge);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.badge.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Badge not found');
    }
    const deletedBadge = await prisma_1.prisma.badge.delete({
        where: { id }
    });
    res.json({ message: 'Badge hard deleted successfully', data: deletedBadge });
}));
exports.default = router;
