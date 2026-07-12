"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
router.get('/esg-overview', (0, errors_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const scores = await prisma_1.prisma.departmentScore.findMany({
        where: { period },
        include: { department: true }
    });
    const sum = scores.reduce((acc, curr) => acc + curr.totalScore, 0);
    const overallESGScore = scores.length > 0 ? sum / scores.length : 100;
    const allScores = await prisma_1.prisma.departmentScore.findMany();
    const scoresByPeriod = {};
    for (const s of allScores) {
        if (!scoresByPeriod[s.period]) {
            scoresByPeriod[s.period] = [];
        }
        scoresByPeriod[s.period].push(s.totalScore);
    }
    const trendOverTime = Object.entries(scoresByPeriod)
        .map(([p, vals]) => {
        const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
        return { period: p, overallScore: avg };
    })
        .sort((a, b) => a.period.localeCompare(b.period));
    res.json({
        overallESGScore,
        departmentScores: scores,
        trendOverTime
    });
}));
exports.default = router;
