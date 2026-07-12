import { prisma } from '../prisma';
import {
  computeEnvironmentalScore,
  computeSocialScore,
  computeGovernanceScore,
  persistDepartmentScore
} from '../services/scoring';

describe('ESG Scoring Module Tests', () => {
  let departmentId: string;
  let emp1Id: string;
  let emp2Id: string;
  let goalId: string;
  let categoryId: string;
  let activityId: string;
  let policyId: string;
  let efId: string;
  const period = '2026-07';

  beforeAll(async () => {
    const systemSettings = await prisma.systemSetting.findFirst();
    if (!systemSettings) {
      await prisma.systemSetting.create({
        data: {
          id: 'default',
          esgWeightEnvironmental: 40,
          esgWeightSocial: 30,
          esgWeightGovernance: 30,
          subScoreFormulaConfigJson: JSON.stringify({
            social: { csrWeight: 0.4, diversityWeight: 0.3, trainingWeight: 0.3 },
            governance: { policyWeight: 0.4, auditWeight: 0.3, complianceWeight: 0.3 }
          })
        }
      });
    } else {
      await prisma.systemSetting.update({
        where: { id: 'default' },
        data: {
          esgWeightEnvironmental: 40,
          esgWeightSocial: 30,
          esgWeightGovernance: 30,
          subScoreFormulaConfigJson: JSON.stringify({
            social: { csrWeight: 0.4, diversityWeight: 0.3, trainingWeight: 0.3 },
            governance: { policyWeight: 0.4, auditWeight: 0.3, complianceWeight: 0.3 }
          })
        }
      });
    }

    const dept = await prisma.department.create({
      data: {
        name: `Test Scoring Dept ${Date.now()}`,
        code: `SCORDEPT-${Date.now()}`,
        status: 'ACTIVE'
      }
    });
    departmentId = dept.id;

    const emp1 = await prisma.user.create({
      data: {
        name: 'Scoring Emp 1',
        email: `score1-${Date.now()}@ecosphere.local`,
        passwordHash: 'hash',
        role: 'EMPLOYEE',
        departmentId
      }
    });
    emp1Id = emp1.id;

    const emp2 = await prisma.user.create({
      data: {
        name: 'Scoring Emp 2',
        email: `score2-${Date.now()}@ecosphere.local`,
        passwordHash: 'hash',
        role: 'EMPLOYEE',
        departmentId
      }
    });
    emp2Id = emp2.id;

    await prisma.diversityRecord.createMany({
      data: [
        { employeeId: emp1Id, gender: 'Female', nationality: 'US', ageBand: '25-34' },
        { employeeId: emp2Id, gender: 'Male', nationality: 'US', ageBand: '35-44' }
      ]
    });

    const goal = await prisma.environmentalGoal.create({
      data: {
        title: 'Reduce carbon',
        departmentId,
        metricType: 'CO2e',
        targetValue: 100,
        currentValue: 0,
        unit: 'kg',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        targetDate: new Date('2026-07-31T23:59:59.000Z')
      }
    });
    goalId = goal.id;

    const ef = await prisma.emissionFactor.create({
      data: {
        activityType: 'FLEET',
        unit: 'liter',
        co2eFactor: 1.0,
        source: 'EPA',
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        status: 'ACTIVE'
      }
    });
    efId = ef.id;

    await prisma.carbonTransaction.createMany({
      data: [
        {
          departmentId,
          emissionFactorId: efId,
          sourceType: 'FLEET',
          quantity: 40,
          calculatedCO2e: 40,
          transactionDate: new Date('2026-07-05T12:00:00.000Z'),
          createdById: emp1Id
        },
        {
          departmentId,
          emissionFactorId: efId,
          sourceType: 'FLEET',
          quantity: 60,
          calculatedCO2e: 60,
          transactionDate: new Date('2026-07-10T12:00:00.000Z'),
          createdById: emp1Id
        },
        {
          departmentId,
          emissionFactorId: efId,
          sourceType: 'FLEET',
          quantity: 25,
          calculatedCO2e: 25,
          transactionDate: new Date('2026-07-15T12:00:00.000Z'),
          createdById: emp1Id
        }
      ]
    });

    const cat = await prisma.category.create({
      data: {
        name: `Scoring CSR Cat ${Date.now()}`,
        type: 'CSR_ACTIVITY',
        status: 'ACTIVE'
      }
    });
    categoryId = cat.id;

    const activity = await prisma.cSRActivity.create({
      data: {
        title: 'CSR Trees',
        categoryId,
        departmentId,
        date: new Date('2026-07-10T09:00:00.000Z'),
        points: 10
      }
    });
    activityId = activity.id;

    await prisma.employeeParticipation.create({
      data: {
        employeeId: emp1Id,
        activityId,
        approvalStatus: 'APPROVED',
        completionDate: new Date('2026-07-12T12:00:00.000Z')
      }
    });

    await prisma.trainingRecord.createMany({
      data: [
        {
          employeeId: emp1Id,
          trainingName: 'ESG Basics',
          status: 'COMPLETED',
          completedAt: new Date('2026-07-12T12:00:00.000Z'),
          createdAt: new Date('2026-07-01T00:00:00.000Z')
        },
        {
          employeeId: emp2Id,
          trainingName: 'Security Info',
          status: 'ASSIGNED',
          createdAt: new Date('2026-07-01T00:00:00.000Z')
        }
      ]
    });

    const policy = await prisma.eSGPolicy.create({
      data: {
        title: 'Governance Code',
        category: 'GOVERNANCE',
        version: 'v1.0',
        effectiveDate: new Date('2026-07-01T00:00:00.000Z'),
        mandatoryAcknowledgement: true,
        status: 'PUBLISHED'
      }
    });
    policyId = policy.id;

    await prisma.policyAcknowledgement.createMany({
      data: [
        {
          employeeId: emp1Id,
          policyId,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date('2026-07-12T12:00:00.000Z'),
          createdAt: new Date('2026-07-02T00:00:00.000Z')
        },
        {
          employeeId: emp2Id,
          policyId,
          status: 'PENDING',
          createdAt: new Date('2026-07-02T00:00:00.000Z')
        }
      ]
    });

    await prisma.audit.create({
      data: {
        title: 'Safety Audit',
        departmentId,
        auditorId: emp1Id,
        startDate: new Date('2026-07-10T00:00:00.000Z'),
        endDate: new Date('2026-07-12T00:00:00.000Z'),
        status: 'COMPLETED',
        createdAt: new Date('2026-07-02T00:00:00.000Z')
      }
    });

    await prisma.complianceIssue.createMany({
      data: [
        {
          ownerId: emp1Id,
          severity: 'HIGH',
          description: 'Firewall update complete',
          status: 'RESOLVED',
          dueDate: new Date('2026-07-15T00:00:00.000Z')
        },
        {
          ownerId: emp2Id,
          severity: 'HIGH',
          description: 'Update policies',
          status: 'OPEN',
          dueDate: new Date('2026-08-15T00:00:00.000Z')
        }
      ]
    });
  });

  afterAll(async () => {
    await prisma.complianceIssue.deleteMany({ where: { ownerId: { in: [emp1Id, emp2Id] } } });
    await prisma.audit.deleteMany({ where: { departmentId } });
    await prisma.policyAcknowledgement.deleteMany({ where: { employeeId: { in: [emp1Id, emp2Id] } } });
    await prisma.eSGPolicy.deleteMany({ where: { id: policyId } });
    await prisma.trainingRecord.deleteMany({ where: { employeeId: { in: [emp1Id, emp2Id] } } });
    await prisma.employeeParticipation.deleteMany({ where: { employeeId: { in: [emp1Id, emp2Id] } } });
    await prisma.cSRActivity.deleteMany({ where: { id: activityId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.carbonTransaction.deleteMany({ where: { departmentId } });
    await prisma.emissionFactor.delete({ where: { id: efId } });
    await prisma.environmentalGoal.deleteMany({ where: { id: goalId } });
    await prisma.diversityRecord.deleteMany({ where: { employeeId: { in: [emp1Id, emp2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [emp1Id, emp2Id] } } });
    await prisma.departmentScore.deleteMany({ where: { departmentId } });
    await prisma.department.delete({ where: { id: departmentId } });
  });

  it('should compute environmental score matching the formula exactly', async () => {
    const score = await computeEnvironmentalScore(departmentId, period);
    expect(score).toBeCloseTo(80, 1);
  });

  it('should compute social score matching the config and Simpson Index exactly', async () => {
    const score = await computeSocialScore(departmentId, period);
    expect(score).toBeCloseTo(50, 1);
  });

  it('should compute governance score matching default weights exactly', async () => {
    const score = await computeGovernanceScore(departmentId, period);
    expect(score).toBeCloseTo(65, 1);
  });

  it('should compute and persist correct total ESG score rollup', async () => {
    const persisted = await persistDepartmentScore(departmentId, period);
    expect(persisted.environmentalScore).toBeCloseTo(80, 1);
    expect(persisted.socialScore).toBeCloseTo(50, 1);
    expect(persisted.governanceScore).toBeCloseTo(65, 1);
    expect(persisted.totalScore).toBeCloseTo(66.5, 1);
  });
});
