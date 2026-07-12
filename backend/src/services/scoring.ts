import { prisma } from '../prisma';

function computeSimpsonIndex(values: string[]): number {
  if (values.length === 0) {
    return 100;
  }
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  let sumSquaredProportions = 0;
  for (const c of Object.values(counts)) {
    const p = c / values.length;
    sumSquaredProportions += p * p;
  }
  const simpson = 1 - sumSquaredProportions;
  return Math.min(simpson * 200, 100);
}

export async function computeEnvironmentalScore(departmentId: string, period: string): Promise<number> {
  const start = new Date(`${period}-01T00:00:00.000Z`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.carbonTransaction.aggregate({
    where: {
      departmentId,
      transactionDate: { gte: start, lte: end }
    },
    _sum: { calculatedCO2e: true }
  });
  const actualEmissions = Number(transactions._sum.calculatedCO2e || 0);

  const goal = await prisma.environmentalGoal.findFirst({
    where: {
      departmentId,
      startDate: { lte: end },
      targetDate: { gte: start }
    }
  });

  if (!goal) {
    return 100;
  }

  const targetValue = Number(goal.targetValue);
  if (targetValue <= 0) {
    return 100;
  }

  if (actualEmissions === 0) {
    return 100;
  }

  return Math.min(Math.max(targetValue / actualEmissions, 0), 1) * 100;
}

export async function computeSocialScore(departmentId: string, period: string): Promise<number> {
  const start = new Date(`${period}-01T00:00:00.000Z`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

  const employees = await prisma.user.findMany({
    where: { departmentId }
  });
  const employeeIds = employees.map(e => e.id);

  if (employeeIds.length === 0) {
    return 100;
  }

  const uniqueCsrEmployees = await prisma.employeeParticipation.groupBy({
    by: ['employeeId'],
    where: {
      employeeId: { in: employeeIds },
      approvalStatus: 'APPROVED',
      completionDate: { gte: start, lte: end }
    }
  });
  const csrRate = (uniqueCsrEmployees.length / employeeIds.length) * 100;

  const diversityRecords = await prisma.diversityRecord.findMany({
    where: { employeeId: { in: employeeIds } }
  });
  const genders = diversityRecords.map(d => d.gender).filter(Boolean);
  const nationalities = diversityRecords.map(d => d.nationality).filter(Boolean);

  const genderIndex = computeSimpsonIndex(genders);
  const nationalityIndex = computeSimpsonIndex(nationalities);
  const diversityScore = (genderIndex + nationalityIndex) / 2;

  const trainingCompleted = await prisma.trainingRecord.count({
    where: {
      employeeId: { in: employeeIds },
      status: 'COMPLETED',
      completedAt: { gte: start, lte: end }
    }
  });
  const trainingTotal = await prisma.trainingRecord.count({
    where: {
      employeeId: { in: employeeIds },
      createdAt: { lte: end }
    }
  });
  const trainingRate = trainingTotal > 0 ? (trainingCompleted / trainingTotal) * 100 : 100;

  const settings = await prisma.systemSetting.findFirst();
  let csrWeight = 0.4;
  let diversityWeight = 0.3;
  let trainingWeight = 0.3;

  if (settings && settings.subScoreFormulaConfigJson) {
    try {
      const config = JSON.parse(settings.subScoreFormulaConfigJson);
      if (config.social) {
        csrWeight = config.social.csrWeight ?? csrWeight;
        diversityWeight = config.social.diversityWeight ?? diversityWeight;
        trainingWeight = config.social.trainingWeight ?? trainingWeight;
      }
    } catch {}
  }

  return csrRate * csrWeight + diversityScore * diversityWeight + trainingRate * trainingWeight;
}

export async function computeGovernanceScore(departmentId: string, period: string): Promise<number> {
  const start = new Date(`${period}-01T00:00:00.000Z`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

  const employees = await prisma.user.findMany({
    where: { departmentId }
  });
  const employeeIds = employees.map(e => e.id);

  if (employeeIds.length === 0) {
    return 100;
  }

  const policyAcked = await prisma.policyAcknowledgement.count({
    where: {
      employeeId: { in: employeeIds },
      status: 'ACKNOWLEDGED',
      acknowledgedAt: { gte: start, lte: end }
    }
  });
  const policyTotal = await prisma.policyAcknowledgement.count({
    where: {
      employeeId: { in: employeeIds },
      createdAt: { lte: end }
    }
  });
  const policyRate = policyTotal > 0 ? (policyAcked / policyTotal) * 100 : 100;

  const auditsCompleted = await prisma.audit.count({
    where: {
      departmentId,
      status: 'COMPLETED',
      endDate: { gte: start, lte: end }
    }
  });
  const auditsTotal = await prisma.audit.count({
    where: {
      departmentId,
      createdAt: { lte: end }
    }
  });
  const auditRate = auditsTotal > 0 ? (auditsCompleted / auditsTotal) * 100 : 100;

  const resolvedIssues = await prisma.complianceIssue.count({
    where: {
      ownerId: { in: employeeIds },
      status: { in: ['RESOLVED', 'CLOSED'] }
    }
  });
  const totalIssues = await prisma.complianceIssue.count({
    where: {
      ownerId: { in: employeeIds }
    }
  });
  const issuesRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 100;

  const overdueIssues = await prisma.complianceIssue.count({
    where: {
      ownerId: { in: employeeIds },
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      dueDate: { lt: new Date() }
    }
  });
  const complianceScore = Math.max(0, issuesRate - overdueIssues * 10);

  const settings = await prisma.systemSetting.findFirst();
  let policyWeight = 0.4;
  let auditWeight = 0.3;
  let complianceWeight = 0.3;

  if (settings && settings.subScoreFormulaConfigJson) {
    try {
      const config = JSON.parse(settings.subScoreFormulaConfigJson);
      if (config.governance) {
        policyWeight = config.governance.policyWeight ?? policyWeight;
        auditWeight = config.governance.auditWeight ?? auditWeight;
        complianceWeight = config.governance.complianceWeight ?? complianceWeight;
      }
    } catch {}
  }

  return policyRate * policyWeight + auditRate * auditWeight + complianceScore * complianceWeight;
}

export async function persistDepartmentScore(departmentId: string, period: string): Promise<any> {
  const [envScore, socScore, govScore, settings] = await Promise.all([
    computeEnvironmentalScore(departmentId, period),
    computeSocialScore(departmentId, period),
    computeGovernanceScore(departmentId, period),
    prisma.systemSetting.findFirst()
  ]);

  const wEnv = settings ? settings.esgWeightEnvironmental : 40;
  const wSoc = settings ? settings.esgWeightSocial : 30;
  const wGov = settings ? settings.esgWeightGovernance : 30;

  const totalScore = (envScore * wEnv + socScore * wSoc + govScore * wGov) / 100;

  const upserted = await prisma.departmentScore.upsert({
    where: {
      departmentId_period: {
        departmentId,
        period
      }
    },
    update: {
      environmentalScore: envScore,
      socialScore: socScore,
      governanceScore: govScore,
      totalScore
    },
    create: {
      departmentId,
      period,
      environmentalScore: envScore,
      socialScore: socScore,
      governanceScore: govScore,
      totalScore
    }
  });

  return upserted;
}
