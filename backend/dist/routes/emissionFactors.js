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
const activityTypeEnum = zod_1.z.enum(['PURCHASE', 'MANUFACTURING', 'EXPENSE', 'FLEET']);
const createSchema = zod_1.z.object({
    activityType: activityTypeEnum,
    unit: zod_1.z.string().min(1),
    co2eFactor: zod_1.z.number().nonnegative(),
    source: zod_1.z.string().nullable().optional(),
    validFrom: zod_1.z.string().datetime(),
    validTo: zod_1.z.string().datetime().nullable().optional(),
    status: statusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const activityType = req.query.activityType;
    const unit = req.query.unit;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (activityType) {
        where.activityType = activityType;
    }
    if (unit) {
        where.unit = { contains: unit, mode: 'insensitive' };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.emissionFactor.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.emissionFactor.count({ where })
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
    const item = await prisma_1.prisma.emissionFactor.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Emission factor not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { activityType, unit, co2eFactor, source, validFrom, validTo, status } = req.body;
    const newFactor = await prisma_1.prisma.emissionFactor.create({
        data: {
            activityType,
            unit,
            co2eFactor: co2eFactor.toString(),
            source: source || null,
            validFrom: new Date(validFrom),
            validTo: validTo ? new Date(validTo) : null,
            status
        }
    });
    res.status(201).json(newFactor);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.emissionFactor.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Emission factor not found');
    }
    const { activityType, unit, co2eFactor, source, validFrom, validTo, status } = req.body;
    const updatedFactor = await prisma_1.prisma.emissionFactor.update({
        where: { id },
        data: {
            activityType,
            unit,
            co2eFactor: co2eFactor !== undefined ? co2eFactor.toString() : undefined,
            source: source === undefined ? undefined : (source || null),
            validFrom: validFrom ? new Date(validFrom) : undefined,
            validTo: validTo === undefined ? undefined : (validTo ? new Date(validTo) : null),
            status
        }
    });
    res.json(updatedFactor);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.emissionFactor.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Emission factor not found');
    }
    const deletedFactor = await prisma_1.prisma.emissionFactor.delete({
        where: { id }
    });
    res.json({ message: 'Emission factor hard deleted successfully', data: deletedFactor });
}));
exports.default = router;
