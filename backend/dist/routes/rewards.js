"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
const rewardStatusEnum = zod_1.z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']);
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    pointsRequired: zod_1.z.number().int().nonnegative(),
    stock: zod_1.z.number().int().nonnegative(),
    status: rewardStatusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const where = {};
    if (status) {
        where.status = status;
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.reward.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.reward.count({ where })
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
    const item = await prisma_1.prisma.reward.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Reward not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { name, description, pointsRequired, stock, status } = req.body;
    const newReward = await prisma_1.prisma.reward.create({
        data: { name, description, pointsRequired, stock, status }
    });
    res.status(201).json(newReward);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.reward.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Reward not found');
    }
    const { name, description, pointsRequired, stock, status } = req.body;
    const updatedReward = await prisma_1.prisma.reward.update({
        where: { id },
        data: { name, description, pointsRequired, stock, status }
    });
    res.json(updatedReward);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.reward.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Reward not found');
    }
    const deletedReward = await prisma_1.prisma.reward.update({
        where: { id },
        data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Reward soft deleted successfully', data: deletedReward });
}));
exports.default = router;
