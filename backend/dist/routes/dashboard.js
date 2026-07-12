"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/diversity', auth_1.authenticateJWT, async (req, res) => {
    try {
        const records = await prisma.diversityRecord.findMany();
        const gender = {};
        const ageBand = {};
        const nationality = {};
        for (const r of records) {
            gender[r.gender] = (gender[r.gender] || 0) + 1;
            ageBand[r.ageBand] = (ageBand[r.ageBand] || 0) + 1;
            nationality[r.nationality] = (nationality[r.nationality] || 0) + 1;
        }
        res.json({ gender, ageBand, nationality });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/training-completion', auth_1.authenticateJWT, async (req, res) => {
    try {
        const records = await prisma.trainingRecord.findMany({
            include: {
                employee: {
                    include: { department: true }
                }
            }
        });
        if (records.length === 0) {
            return res.json({ overall: 0, byDepartment: [] });
        }
        const completed = records.filter((r) => r.status === 'COMPLETED').length;
        const overall = (completed / records.length) * 100;
        const deptMap = {};
        for (const r of records) {
            const deptName = r.employee?.department?.name || 'Unassigned';
            if (!deptMap[deptName]) {
                deptMap[deptName] = { total: 0, completed: 0 };
            }
            deptMap[deptName].total++;
            if (r.status === 'COMPLETED') {
                deptMap[deptName].completed++;
            }
        }
        const byDepartment = Object.entries(deptMap).map(([name, val]) => ({
            departmentName: name,
            completionRate: (val.completed / val.total) * 100
        }));
        res.json({ overall, byDepartment });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/social', auth_1.authenticateJWT, async (req, res) => {
    try {
        const totalEmployees = await prisma.user.count({
            where: { role: { not: 'ADMIN' } }
        });
        const participatingEmployees = await prisma.user.count({
            where: {
                role: { not: 'ADMIN' },
                csrParticipations: {
                    some: { approvalStatus: 'APPROVED' }
                }
            }
        });
        const csrParticipationRate = totalEmployees > 0 ? (participatingEmployees / totalEmployees) * 100 : 0;
        const records = await prisma.diversityRecord.findMany();
        const gender = {};
        const ageBand = {};
        const nationality = {};
        for (const r of records) {
            gender[r.gender] = (gender[r.gender] || 0) + 1;
            ageBand[r.ageBand] = (ageBand[r.ageBand] || 0) + 1;
            nationality[r.nationality] = (nationality[r.nationality] || 0) + 1;
        }
        const diversitySummary = { gender, ageBand, nationality };
        const trainingRecords = await prisma.trainingRecord.findMany();
        let trainingCompletionRate = 0;
        if (trainingRecords.length > 0) {
            const completedTrainings = trainingRecords.filter((t) => t.status === 'COMPLETED').length;
            trainingCompletionRate = (completedTrainings / trainingRecords.length) * 100;
        }
        const activities = await prisma.cSRActivity.findMany({
            include: {
                participations: {
                    where: { approvalStatus: 'APPROVED' }
                }
            }
        });
        const topActivities = activities
            .map((a) => ({
            id: a.id,
            title: a.title,
            approvedParticipationsCount: a.participations.length
        }))
            .sort((a, b) => b.approvedParticipationsCount - a.approvedParticipationsCount)
            .slice(0, 5);
        res.json({
            csrParticipationRate,
            diversitySummary,
            trainingCompletionRate,
            topActivities
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
