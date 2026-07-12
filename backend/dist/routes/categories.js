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
const typeEnum = zod_1.z.enum(['CSR_ACTIVITY', 'CHALLENGE']);
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: typeEnum,
    status: statusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (type) {
        where.type = type;
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.category.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.category.count({ where })
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
    const item = await prisma_1.prisma.category.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Category not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { name, type, status } = req.body;
    const newCategory = await prisma_1.prisma.category.create({
        data: { name, type, status }
    });
    res.status(201).json(newCategory);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Category not found');
    }
    const { name, type, status } = req.body;
    const updatedCategory = await prisma_1.prisma.category.update({
        where: { id },
        data: { name, type, status }
    });
    res.json(updatedCategory);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Category not found');
    }
    const deletedCategory = await prisma_1.prisma.category.delete({
        where: { id }
    });
    res.json({ message: 'Category hard deleted successfully', data: deletedCategory });
}));
exports.default = router;
