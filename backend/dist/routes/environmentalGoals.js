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
const goalStatusEnum = zod_1.z.enum(['ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED']);
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().nullable().optional(),
    departmentId: zod_1.z.string().nullable().optional(),
    metricType: zod_1.z.string().min(1),
    targetValue: zod_1.z.number().nonnegative(),
    currentValue: zod_1.z.number().nonnegative().optional(),
    unit: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime(),
    targetDate: zod_1.z.string().datetime(),
    status: goalStatusEnum
});
const updateSchema = createSchema.partial();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const departmentId = req.query.departmentId;
    const metricType = req.query.metricType;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (departmentId) {
        where.departmentId = departmentId;
    }
    if (metricType) {
        where.metricType = { contains: metricType, mode: 'insensitive' };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma_1.prisma.environmentalGoal.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma_1.prisma.environmentalGoal.count({ where })
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
    const item = await prisma_1.prisma.environmentalGoal.findUnique({
        where: { id: req.params.id }
    });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Environmental goal not found');
    }
    res.json(item);
}));
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(createSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { title, description, departmentId, metricType, targetValue, currentValue, unit, startDate, targetDate, status } = req.body;
    if (departmentId) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
        }
    }
    const newGoal = await prisma_1.prisma.environmentalGoal.create({
        data: {
            title,
            description: description || null,
            departmentId: departmentId || null,
            metricType,
            targetValue: targetValue.toString(),
            currentValue: (currentValue ?? 0).toString(),
            unit,
            startDate: new Date(startDate),
            targetDate: new Date(targetDate),
            status
        }
    });
    res.status(201).json(newGoal);
}));
router.put('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, validation_1.validateBody)(updateSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.environmentalGoal.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Environmental goal not found');
    }
    const { title, description, departmentId, metricType, targetValue, currentValue, unit, startDate, targetDate, status } = req.body;
    if (departmentId) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Department not found', { departmentId: 'Department does not exist' });
        }
    }
    const updatedGoal = await prisma_1.prisma.environmentalGoal.update({
        where: { id },
        data: {
            title,
            description: description === undefined ? undefined : (description || null),
            departmentId: departmentId === undefined ? undefined : (departmentId || null),
            metricType,
            targetValue: targetValue !== undefined ? targetValue.toString() : undefined,
            currentValue: currentValue !== undefined ? currentValue.toString() : undefined,
            unit,
            startDate: startDate ? new Date(startDate) : undefined,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            status
        }
    });
    res.json(updatedGoal);
}));
router.delete('/:id', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.environmentalGoal.findUnique({ where: { id } });
    if (!item) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Environmental goal not found');
    }
    const deletedGoal = await prisma_1.prisma.environmentalGoal.delete({
        where: { id }
    });
    res.json({ message: 'Environmental goal hard deleted successfully', data: deletedGoal });
}));
router.patch('/:id/recalculate', (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const goal = await prisma_1.prisma.environmentalGoal.findUnique({ where: { id } });
    if (!goal) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Environmental goal not found');
    }
    const where = {};
    if (goal.departmentId) {
        where.departmentId = goal.departmentId;
    }
    const txs = await prisma_1.prisma.carbonTransaction.findMany({
        where,
        include: { emissionFactor: true }
    });
    const isCarbonMetric = goal.unit.toLowerCase().includes('co2') || goal.metricType.toLowerCase().includes('co2');
    let total = 0;
    for (const tx of txs) {
        const txUnit = tx.emissionFactor.unit;
        if (txUnit.toLowerCase() === goal.unit.toLowerCase() || txUnit.toLowerCase() === goal.metricType.toLowerCase() || isCarbonMetric) {
            total += isCarbonMetric ? Number(tx.calculatedCO2e) : Number(tx.quantity);
        }
    }
    const newStatus = (0, calculations_1.deriveGoalStatus)(total, Number(goal.targetValue), goal.startDate, goal.targetDate, new Date());
    const updatedGoal = await prisma_1.prisma.environmentalGoal.update({
        where: { id },
        data: {
            currentValue: total.toString(),
            status: newStatus
        }
    });
    res.json(updatedGoal);
}));
exports.default = router;
