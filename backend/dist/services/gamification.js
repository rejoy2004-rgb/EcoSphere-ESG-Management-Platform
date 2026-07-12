"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBadgeAutoAwardEnabled = isBadgeAutoAwardEnabled;
exports.evaluateBadgesForEmployee = evaluateBadgesForEmployee;
const prisma_1 = require("../prisma");
async function isBadgeAutoAwardEnabled() {
    return true;
}
async function evaluateBadgesForEmployee(employeeId) {
    const enabled = await isBadgeAutoAwardEnabled();
    if (!enabled) {
        return [];
    }
    const [badges, ledgerSums, completedChallenges, csrApproved] = await Promise.all([
        prisma_1.prisma.badge.findMany(),
        prisma_1.prisma.pointsLedgerEntry.aggregate({
            where: { employeeId },
            _sum: { delta: true }
        }),
        prisma_1.prisma.challengeParticipation.count({
            where: { employeeId, approval: 'APPROVED' }
        }),
        prisma_1.prisma.employeeParticipation.count({
            where: { employeeId, approvalStatus: 'APPROVED' }
        })
    ]);
    const xp = ledgerSums._sum.delta || 0;
    const unlockedBadges = [];
    for (const badge of badges) {
        let rule;
        try {
            rule = JSON.parse(badge.unlockRuleJson);
        }
        catch {
            continue;
        }
        let metricVal = 0;
        const metricName = rule.metric ? rule.metric.toUpperCase() : '';
        if (metricName === 'XP') {
            metricVal = xp;
        }
        else if (metricName === 'COMPLETED_CHALLENGES') {
            metricVal = completedChallenges;
        }
        else if (metricName === 'APPROVED_CSR' || metricName === 'CSR_APPROVED' || metricName === 'CSR_ACTIVITIES') {
            metricVal = csrApproved;
        }
        else {
            continue;
        }
        const targetVal = Number(rule.value);
        const op = rule.operator;
        let isEligible = false;
        if (op === '>=') {
            isEligible = metricVal >= targetVal;
        }
        else if (op === '>') {
            isEligible = metricVal > targetVal;
        }
        else if (op === '==' || op === '=') {
            isEligible = metricVal === targetVal;
        }
        else if (op === '<=') {
            isEligible = metricVal <= targetVal;
        }
        else if (op === '<') {
            isEligible = metricVal < targetVal;
        }
        if (isEligible) {
            const existing = await prisma_1.prisma.employeeBadge.findUnique({
                where: {
                    employeeId_badgeId: {
                        employeeId,
                        badgeId: badge.id
                    }
                }
            });
            if (!existing) {
                const unlocked = await prisma_1.prisma.employeeBadge.create({
                    data: {
                        employeeId,
                        badgeId: badge.id
                    },
                    include: { badge: true }
                });
                console.log(`[Notification Stub] Employee ${employeeId} unlocked badge ${badge.name}!`);
                unlockedBadges.push(unlocked);
            }
        }
    }
    return unlockedBadges;
}
