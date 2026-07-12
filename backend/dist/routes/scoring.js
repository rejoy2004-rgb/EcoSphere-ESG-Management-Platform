"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
const scoring_1 = require("../services/scoring");
const calculations_1 = require("../utils/calculations");
const router = (0, express_1.Router)();
router.post('/recalculate', auth_1.authenticateJWT, (0, auth_1.requireRole)(['ADMIN', 'ESG_MANAGER']), (0, errors_1.asyncHandler)(async (req, res) => {
    const { departmentId, period } = req.body;
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetPeriod = period || currentPeriod;
    let departmentsToRecalculate = [];
    if (departmentId) {
        const dept = await prisma_1.prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            return res.status(404).json({ error: 'Department not found' });
        }
        departmentsToRecalculate.push(dept);
    }
    else {
        departmentsToRecalculate = await prisma_1.prisma.department.findMany();
    }
    const results = [];
    for (const dept of departmentsToRecalculate) {
        const score = await (0, scoring_1.persistDepartmentScore)(dept.id, targetPeriod);
        results.push(score);
    }
    const goals = await prisma_1.prisma.environmentalGoal.findMany();
    for (const goal of goals) {
        const where = {};
        if (goal.departmentId) {
            where.departmentId = goal.departmentId;
        }
        const txs = await prisma_1.prisma.carbonTransaction.findMany({
            where,
            include: { emissionFactor: true }
        });
        const isCarbonMetric = goal.unit.toLowerCase().includes('co2') || goal.metricType.toLowerCase().includes('co2') || goal.unit.toLowerCase().includes('carbon');
        let total = 0;
        for (const tx of txs) {
            const txUnit = tx.emissionFactor?.unit || '';
            if (txUnit.toLowerCase() === goal.unit.toLowerCase() || txUnit.toLowerCase() === goal.metricType.toLowerCase() || isCarbonMetric) {
                total += isCarbonMetric ? Number(tx.calculatedCO2e) : Number(tx.quantity);
            }
        }
        const newStatus = (0, calculations_1.deriveGoalStatus)(total, Number(goal.targetValue), goal.startDate, goal.targetDate, new Date());
        await prisma_1.prisma.environmentalGoal.update({
            where: { id: goal.id },
            data: {
                currentValue: total.toString(),
                status: newStatus
            }
        });
    }
    res.json({
        message: 'ESG scores and sustainability goals recalculated successfully',
        period: targetPeriod,
        results
    });
}));
exports.default = router;
