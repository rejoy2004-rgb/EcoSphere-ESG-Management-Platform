import { prisma } from '../prisma';

export async function isBadgeAutoAwardEnabled(): Promise<boolean> {
  return true;
}

export async function evaluateBadgesForEmployee(employeeId: string): Promise<any[]> {
  const enabled = await isBadgeAutoAwardEnabled();
  if (!enabled) {
    return [];
  }

  const [badges, ledgerSums, completedChallenges, csrApproved] = await Promise.all([
    prisma.badge.findMany(),
    prisma.pointsLedgerEntry.aggregate({
      where: { employeeId },
      _sum: { delta: true }
    }),
    prisma.challengeParticipation.count({
      where: { employeeId, approval: 'APPROVED' }
    }),
    prisma.employeeParticipation.count({
      where: { employeeId, approvalStatus: 'APPROVED' }
    })
  ]);

  const xp = ledgerSums._sum.delta || 0;
  const unlockedBadges: any[] = [];

  for (const badge of badges) {
    let rule: any;
    try {
      rule = JSON.parse(badge.unlockRuleJson);
    } catch {
      continue;
    }

    let metricVal = 0;
    const metricName = rule.metric ? rule.metric.toUpperCase() : '';
    if (metricName === 'XP') {
      metricVal = xp;
    } else if (metricName === 'COMPLETED_CHALLENGES') {
      metricVal = completedChallenges;
    } else if (metricName === 'APPROVED_CSR' || metricName === 'CSR_APPROVED' || metricName === 'CSR_ACTIVITIES') {
      metricVal = csrApproved;
    } else {
      continue;
    }

    const targetVal = Number(rule.value);
    const op = rule.operator;
    let isEligible = false;

    if (op === '>=') {
      isEligible = metricVal >= targetVal;
    } else if (op === '>') {
      isEligible = metricVal > targetVal;
    } else if (op === '==' || op === '=') {
      isEligible = metricVal === targetVal;
    } else if (op === '<=') {
      isEligible = metricVal <= targetVal;
    } else if (op === '<') {
      isEligible = metricVal < targetVal;
    }

    if (isEligible) {
      const existing = await prisma.employeeBadge.findUnique({
        where: {
          employeeId_badgeId: {
            employeeId,
            badgeId: badge.id
          }
        }
      });

      if (!existing) {
        const unlocked = await prisma.employeeBadge.create({
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
