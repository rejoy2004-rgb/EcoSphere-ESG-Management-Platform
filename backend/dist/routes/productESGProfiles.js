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
    productName: zod_1.z.string().min(1),
    carbonFootprintPerUnit: zod_1.z.number().nonnegative(),
    sustainabilityRating: zod_1.z.string().nullable().optional(),
    materialComposition: zod_1.z.string().nullable().optional(),
    certifications: zod_1.z.array(zod_1.z.string()),
    status: statusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const productName = req.query.productName;
    const sustainabilityRating = req.query.sustainabilityRating;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (productName) {
        where.productName = { contains: productName, mode: 'insensitive' };
    }
    if (sustainabilityRating) {
        where.sustainabilityRating = { contains: sustainabilityRating, mode: 'insensitive' };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.productESGProfile.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.productESGProfile.count({ where })
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
    const item = await prisma_1.prisma.productESGProfile.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { productName, carbonFootprintPerUnit, sustainabilityRating, materialComposition, certifications, status } = req.body;
    const newProfile = await prisma_1.prisma.productESGProfile.create({
        data: {
            productName,
            carbonFootprintPerUnit: carbonFootprintPerUnit.toString(),
            sustainabilityRating: sustainabilityRating || null,
            materialComposition: materialComposition || null,
            certifications,
            status
        }
    });
    res.status(201).json(newProfile);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.productESGProfile.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
    }
    const { productName, carbonFootprintPerUnit, sustainabilityRating, materialComposition, certifications, status } = req.body;
    const updatedProfile = await prisma_1.prisma.productESGProfile.update({
        where: { id },
        data: {
            productName,
            carbonFootprintPerUnit: carbonFootprintPerUnit !== undefined ? carbonFootprintPerUnit.toString() : undefined,
            sustainabilityRating: sustainabilityRating === undefined ? undefined : (sustainabilityRating || null),
            materialComposition: materialComposition === undefined ? undefined : (materialComposition || null),
            certifications,
            status
        }
    });
    res.json(updatedProfile);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.productESGProfile.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Product ESG profile not found');
    }
    const deletedProfile = await prisma_1.prisma.productESGProfile.update({
        where: { id },
        data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Product ESG profile soft deleted successfully', data: deletedProfile });
}));
exports.default = router;
