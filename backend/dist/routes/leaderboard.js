"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const scope = req.query.scope || 'org';
    const departmentId = req.query.departmentId;
    const period = req.query.period || 'all';
    const now = new Date();
    const where = {
        delta: { gt: 0 }
    };
    if (scope === 'department' && departmentId) {
        where.employee = { departmentId };
    }
    if (period === 'week') {
        where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    }
    else if (period === 'month') {
        where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    }
    else if (period === 'quarter') {
        where.createdAt = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    }
    const entries = await prisma_1.prisma.pointsLedgerEntry.findMany({
        where,
        include: {
            employee: {
                include: { department: true }
            }
        }
    });
    const userPoints = {};
    for (const entry of entries) {
        const emp = entry.employee;
        if (!userPoints[entry.employeeId]) {
            userPoints[entry.employeeId] = {
                name: emp.name,
                departmentName: emp.department?.name || 'Unassigned',
                points: 0
            };
        }
        userPoints[entry.employeeId].points += entry.delta;
    }
    const ranked = Object.entries(userPoints)
        .map(([id, val]) => ({
        id,
        name: val.name,
        department: val.departmentName,
        points: val.points
    }))
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
        rank: index + 1,
        ...user
    }));
    res.json(ranked);
}));
exports.default = router;
