"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const calculations_1 = require("../utils/calculations");
const router = (0, express_1.Router)();
const sourceTypeEnum = zod_1.z.enum(['PURCHASE', 'MANUFACTURING', 'EXPENSE', 'FLEET']);
const createSchema = zod_1.z.object({
    departmentId: zod_1.z.string().min(1),
    sourceType: sourceTypeEnum,
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string().min(1),
    co2eFactor: zod_1.z.number().nonnegative().optional(),
    transactionDate: zod_1.z.string().datetime(),
    description: zod_1.z.string().nullable().optional(),
    createdById: zod_1.z.string().nullable().optional()
});
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const departmentId = req.query.departmentId;
    const from = req.query.from;
    const to = req.query.to;
    const sourceType = req.query.sourceType;
    const where = {};
    if (departmentId) {
        where.departmentId = departmentId;
    }
    if (sourceType) {
        where.sourceType = sourceType;
    }
    if (from || to) {
        where.transactionDate = {};
        if (from) {
            where.transactionDate.gte = new Date(from);
        }
        if (to) {
            where.transactionDate.lte = new Date(to);
        }
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.carbonTransaction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { transactionDate: 'desc' }
        }),
        prisma_1.prisma.carbonTransaction.count({ where })
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
router.get('/summary', (0, errors_1.asyncHandler)(async (req, res) => {
    const departmentId = req.query.departmentId;
    const from = req.query.from;
    const to = req.query.to;
    const where = {};
    if (departmentId) {
        where.departmentId = departmentId;
    }
    if (from || to) {
        where.transactionDate = {};
        if (from) {
            where.transactionDate.gte = new Date(from);
        }
        if (to) {
            where.transactionDate.lte = new Date(to);
        }
    }
    const txs = await prisma_1.prisma.carbonTransaction.findMany({ where });
    const breakdown = {
        PURCHASE: 0,
        MANUFACTURING: 0,
        EXPENSE: 0,
        FLEET: 0
    };
    let totalCO2e = 0;
    for (const tx of txs) {
        const co2e = Number(tx.calculatedCO2e);
        totalCO2e += co2e;
        breakdown[tx.sourceType] = (breakdown[tx.sourceType] || 0) + co2e;
    }
    res.json({
        totalCO2e,
        breakdown
    });
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { departmentId, sourceType, quantity, unit, co2eFactor, transactionDate, description, createdById } = req.body;
    const setting = await prisma_1.prisma.systemSetting.findFirst();
    const autoCalcEnabled = setting ? setting.autoEmissionCalculationEnabled : true;
    if (!autoCalcEnabled && co2eFactor === undefined) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Auto-calculation is disabled. Please provide a manual co2eFactor.', {
            co2eFactor: 'Manual factor required'
        });
    }
    const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
    }
    let factor = await prisma_1.prisma.emissionFactor.findFirst({
        where: {
            activityType: sourceType,
            unit,
            status: 'ACTIVE',
            OR: [
                { validFrom: null },
                { validFrom: { lte: new Date(transactionDate) } }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
    if (co2eFactor === undefined && !factor) {
        throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'No active emission factor found for activity type and unit', {
            sourceType: 'No factor found',
            unit: 'No factor found'
        });
    }
    if (!factor) {
        factor = await prisma_1.prisma.emissionFactor.create({
            data: {
                activityType: sourceType,
                unit,
                co2eFactor: (co2eFactor ?? 0).toString(),
                status: 'ACTIVE'
            }
        });
    }
    const finalFactor = co2eFactor !== undefined ? co2eFactor : Number(factor.co2eFactor);
    const calculated = (0, calculations_1.calculateCO2e)(quantity, finalFactor);
    let userId = createdById;
    if (!userId) {
        let systemUser = await prisma_1.prisma.user.findFirst();
        if (!systemUser) {
            systemUser = await prisma_1.prisma.user.create({
                data: {
                    name: 'System Admin',
                    email: 'admin@ecosphere.local',
                    passwordHash: 'mock-hash',
                    role: 'ADMIN'
                }
            });
        }
        userId = systemUser.id;
    }
    const tx = await prisma_1.prisma.carbonTransaction.create({
        data: {
            departmentId,
            emissionFactorId: factor.id,
            sourceType,
            quantity: quantity.toString(),
            calculatedCO2e: calculated.toString(),
            transactionDate: new Date(transactionDate),
            sourceRecordId: description || null,
            createdById: userId
        }
    });
    res.status(201).json(tx);
}));
exports.default = router;
