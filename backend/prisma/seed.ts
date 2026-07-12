import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { evaluateBadgesForEmployee } from '../src/services/gamification';
import { persistDepartmentScore } from '../src/services/scoring';

const prisma = new PrismaClient();

async function cleanDatabase() {
  await prisma.pointsLedgerEntry.deleteMany();
  await prisma.employeeBadge.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.complianceIssue.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.eSGPolicy.deleteMany();
  await prisma.employeeParticipation.deleteMany();
  await prisma.cSRActivity.deleteMany();
  await prisma.challengeParticipation.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.category.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.environmentalGoal.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.diversityRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.departmentScore.deleteMany();
  await prisma.department.deleteMany();
}

async function main() {
  await cleanDatabase();

  const pwHash = await bcrypt.hash('password123', 10);

  const opsDept = await prisma.department.create({
    data: { name: 'Operations', code: 'OPS', status: 'ACTIVE' }
  });
  const mfgDept = await prisma.department.create({
    data: { name: 'Manufacturing', code: 'MFG', parentDepartmentId: opsDept.id, status: 'ACTIVE' }
  });
  const logDept = await prisma.department.create({
    data: { name: 'Logistics', code: 'LOG', parentDepartmentId: opsDept.id, status: 'ACTIVE' }
  });
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG', status: 'ACTIVE' }
  });
  const swDept = await prisma.department.create({
    data: { name: 'Software', code: 'SWE', parentDepartmentId: engDept.id, status: 'ACTIVE' }
  });
  const qaDept = await prisma.department.create({
    data: { name: 'Quality Assurance', code: 'QA', parentDepartmentId: engDept.id, status: 'ACTIVE' }
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR', status: 'ACTIVE' }
  });

  const adminUser = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@ecosphere.local', passwordHash: pwHash, role: 'ADMIN', departmentId: engDept.id }
  });
  const manager1 = await prisma.user.create({
    data: { name: 'Sarah Jenkins', email: 'sarah.j@ecosphere.local', passwordHash: pwHash, role: 'ESG_MANAGER', departmentId: hrDept.id }
  });
  const manager2 = await prisma.user.create({
    data: { name: 'Robert Miller', email: 'robert.m@ecosphere.local', passwordHash: pwHash, role: 'ESG_MANAGER', departmentId: opsDept.id }
  });

  const opsHead = await prisma.user.create({
    data: { name: 'Operations Head', email: 'ops.head@ecosphere.local', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: opsDept.id }
  });
  const mfgHead = await prisma.user.create({
    data: { name: 'Mfg Head', email: 'mfg.head@ecosphere.local', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: mfgDept.id }
  });
  const logHead = await prisma.user.create({
    data: { name: 'Log Head', email: 'log.head@ecosphere.local', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: logDept.id }
  });
  const engHead = await prisma.user.create({
    data: { name: 'Eng Head', email: 'eng.head@ecosphere.local', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: engDept.id }
  });
  const hrHead = await prisma.user.create({
    data: { name: 'HR Head', email: 'hr.head@ecosphere.local', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: hrDept.id }
  });

  await prisma.department.update({ where: { id: opsDept.id }, data: { headId: opsHead.id } });
  await prisma.department.update({ where: { id: mfgDept.id }, data: { headId: mfgHead.id } });
  await prisma.department.update({ where: { id: logDept.id }, data: { headId: logHead.id } });
  await prisma.department.update({ where: { id: engDept.id }, data: { headId: engHead.id } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { headId: hrHead.id } });

  const depts = [mfgDept.id, logDept.id, swDept.id, qaDept.id, hrDept.id];
  const employees: any[] = [];
  for (let i = 1; i <= 17; i++) {
    const deptId = depts[i % depts.length];
    const emp = await prisma.user.create({
      data: {
        name: `Employee User ${i}`,
        email: `employee${i}@ecosphere.local`,
        passwordHash: pwHash,
        role: 'EMPLOYEE',
        departmentId: deptId,
        pointsBalance: 0
      }
    });
    employees.push(emp);

    const genders = ['Male', 'Female', 'Non-Binary'];
    const nationalities = ['US', 'DE', 'IN', 'JP', 'FR'];
    const ageBands = ['18-24', '25-34', '35-44', '45-54', '55+'];
    await prisma.diversityRecord.create({
      data: {
        employeeId: emp.id,
        gender: genders[i % genders.length],
        nationality: nationalities[i % nationalities.length],
        ageBand: ageBands[i % ageBands.length]
      }
    });
  }

  const csrCat = await prisma.category.create({
    data: { name: 'Community Volunteering', type: 'CSR_ACTIVITY', status: 'ACTIVE' }
  });
  const recyclingCat = await prisma.category.create({
    data: { name: 'Recycling Projects', type: 'CSR_ACTIVITY', status: 'ACTIVE' }
  });
  const carbonCat = await prisma.category.create({
    data: { name: 'Carbon Reduction', type: 'CSR_ACTIVITY', status: 'ACTIVE' }
  });

  const challengeCat1 = await prisma.category.create({
    data: { name: 'Zero Waste Challenge', type: 'CHALLENGE', status: 'ACTIVE' }
  });
  const challengeCat2 = await prisma.category.create({
    data: { name: 'Energy Conservation', type: 'CHALLENGE', status: 'ACTIVE' }
  });

  const efTypes = ['FLEET', 'MANUFACTURING', 'PURCHASE', 'EXPENSE'];
  const units = ['liter', 'kWh', 'kg', 'gallon'];
  const efs: any[] = [];
  for (let i = 0; i < 8; i++) {
    const ef = await prisma.emissionFactor.create({
      data: {
        activityType: efTypes[i % efTypes.length] + `_TYPE_${i}`,
        unit: units[i % units.length],
        co2eFactor: 1.5 + i * 0.2,
        source: 'EPA 2026',
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        status: 'ACTIVE'
      }
    });
    efs.push(ef);
  }

  const periods = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  const allDeptIds = [opsDept.id, mfgDept.id, logDept.id, engDept.id, swDept.id, qaDept.id, hrDept.id];

  for (let i = 0; i < 70; i++) {
    const deptId = allDeptIds[i % allDeptIds.length];
    const ef = efs[i % efs.length];
    const period = periods[i % periods.length];
    const day = String((i % 28) + 1).padStart(2, '0');
    const transactionDate = new Date(`${period}-${day}T12:00:00.000Z`);
    const quantity = 50 + i * 2;
    const calculatedCO2e = quantity * Number(ef.co2eFactor);

    await prisma.carbonTransaction.create({
      data: {
        departmentId: deptId,
        emissionFactorId: ef.id,
        sourceType: ef.activityType.split('_')[0] as any,
        quantity,
        calculatedCO2e,
        transactionDate,
        createdById: adminUser.id
      }
    });
  }

  const goalStatuses = ['ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED'];
  for (let i = 0; i < 11; i++) {
    const deptId = allDeptIds[i % allDeptIds.length];
    const status = goalStatuses[i % goalStatuses.length];
    await prisma.environmentalGoal.create({
      data: {
        title: `Reduce emissions Goal ${i}`,
        departmentId: deptId,
        metricType: 'CO2e',
        targetValue: 5000 + i * 500,
        currentValue: status === 'ACHIEVED' ? 6000 : status === 'MISSED' ? 1000 : 2500,
        unit: 'kg',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        targetDate: status === 'MISSED' ? new Date('2026-06-30T00:00:00.000Z') : new Date('2026-12-31T00:00:00.000Z'),
        status
      }
    });
  }

  const p1 = await prisma.eSGPolicy.create({
    data: {
      title: 'Green Office Policy',
      category: 'ENVIRONMENTAL',
      version: 'v1.0',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      mandatoryAcknowledgement: true,
      status: 'PUBLISHED'
    }
  });
  const p2 = await prisma.eSGPolicy.create({
    data: {
      title: 'Diversity Code of Conduct',
      category: 'SOCIAL',
      version: 'v1.1',
      effectiveDate: new Date('2026-03-01T00:00:00.000Z'),
      mandatoryAcknowledgement: true,
      status: 'PUBLISHED'
    }
  });
  const p3 = await prisma.eSGPolicy.create({
    data: {
      title: 'Anti-Bribery Guidelines',
      category: 'GOVERNANCE',
      version: 'v2.0',
      effectiveDate: new Date('2026-07-01T00:00:00.000Z'),
      mandatoryAcknowledgement: true,
      status: 'DRAFT'
    }
  });

  const acksData: any[] = [];
  employees.forEach((emp, index) => {
    acksData.push({
      employeeId: emp.id,
      policyId: p1.id,
      status: index % 3 === 0 ? 'PENDING' : 'ACKNOWLEDGED',
      acknowledgedAt: index % 3 === 0 ? null : new Date('2026-07-05T09:00:00.000Z')
    });
    acksData.push({
      employeeId: emp.id,
      policyId: p2.id,
      status: index % 2 === 0 ? 'PENDING' : 'ACKNOWLEDGED',
      acknowledgedAt: index % 2 === 0 ? null : new Date('2026-07-06T10:00:00.000Z')
    });
  });
  await prisma.policyAcknowledgement.createMany({ data: acksData });

  const csrStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED'];
  const activities: any[] = [];
  for (let i = 0; i < 11; i++) {
    const act = await prisma.cSRActivity.create({
      data: {
        title: `CSR Activity ${i}`,
        categoryId: i % 2 === 0 ? csrCat.id : recyclingCat.id,
        departmentId: allDeptIds[i % allDeptIds.length],
        date: new Date('2026-07-10T09:00:00.000Z'),
        points: 20 + i * 5,
        status: csrStatuses[i % csrStatuses.length] as any
      }
    });
    activities.push(act);
  }

  const partStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 15; i++) {
    const emp = employees[i % employees.length];
    const act = activities[i % activities.length];
    await prisma.employeeParticipation.create({
      data: {
        employeeId: emp.id,
        activityId: act.id,
        approvalStatus: partStatuses[i % partStatuses.length] as any,
        completionDate: new Date('2026-07-12T12:00:00.000Z')
      }
    });
  }

  const challengeStatuses = ['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED'];
  const challengesList: any[] = [];
  for (let i = 0; i < 11; i++) {
    const ch = await prisma.challenge.create({
      data: {
        title: `Challenge Action ${i}`,
        categoryId: i % 2 === 0 ? challengeCat1.id : challengeCat2.id,
        description: `Perform eco action ${i}`,
        xp: 100 + i * 10,
        difficulty: i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD',
        deadline: new Date('2026-07-31T23:59:59.000Z'),
        status: challengeStatuses[i % challengeStatuses.length] as any
      }
    });
    challengesList.push(ch);
  }

  const appStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 15; i++) {
    const emp = employees[i % employees.length];
    const ch = challengesList[i % challengesList.length];
    const isApp = appStatuses[i % appStatuses.length];

    const part = await prisma.challengeParticipation.create({
      data: {
        challengeId: ch.id,
        employeeId: emp.id,
        progress: i % 3 === 0 ? 0 : i % 3 === 1 ? 50 : 100,
        approval: isApp as any,
        proofUrl: i % 2 === 0 ? `/uploads/evidence-${i}.png` : null
      }
    });

    if (isApp === 'APPROVED') {
      await prisma.pointsLedgerEntry.create({
        data: {
          employeeId: emp.id,
          delta: ch.xp,
          reason: 'CHALLENGE_APPROVAL',
          referenceId: part.id
        }
      });
      await prisma.user.update({
        where: { id: emp.id },
        data: { pointsBalance: { increment: ch.xp } }
      });
    }
  }

  const badge1 = await prisma.badge.create({
    data: {
      name: 'ESG Scholar',
      description: 'Awarded for getting 100+ XP',
      unlockRuleJson: JSON.stringify({ metric: 'XP', operator: '>=', value: 100 }),
      iconUrl: 'https://cdn.ecosphere.local/icons/badge1.png'
    }
  });
  const badge2 = await prisma.badge.create({
    data: {
      name: 'High Flyer',
      description: 'Awarded for getting 300+ XP',
      unlockRuleJson: JSON.stringify({ metric: 'XP', operator: '>=', value: 300 }),
      iconUrl: 'https://cdn.ecosphere.local/icons/badge2.png'
    }
  });
  const badge3 = await prisma.badge.create({
    data: {
      name: 'Zero Waste Star',
      description: 'Awarded for completing 1+ challenges',
      unlockRuleJson: JSON.stringify({ metric: 'COMPLETED_CHALLENGES', operator: '>=', value: 1 }),
      iconUrl: 'https://cdn.ecosphere.local/icons/badge3.png'
    }
  });
  const badge4 = await prisma.badge.create({
    data: {
      name: 'Eco Master',
      description: 'Awarded for completing 3+ challenges',
      unlockRuleJson: JSON.stringify({ metric: 'COMPLETED_CHALLENGES', operator: '>=', value: 3 }),
      iconUrl: 'https://cdn.ecosphere.local/icons/badge4.png'
    }
  });
  const badge5 = await prisma.badge.create({
    data: {
      name: 'Community Ally',
      description: 'Awarded for participating in 1+ CSR activities',
      unlockRuleJson: JSON.stringify({ metric: 'CSR_APPROVED_COUNT', operator: '>=', value: 1 }),
      iconUrl: 'https://cdn.ecosphere.local/icons/badge5.png'
    }
  });

  for (const emp of employees) {
    await evaluateBadgesForEmployee(emp.id);
  }

  await prisma.reward.create({
    data: { name: 'Reusable Solar Flask', description: 'Thermal eco-friendly flask', pointsRequired: 50, stock: 25, status: 'ACTIVE' }
  });
  await prisma.reward.create({
    data: { name: 'Organic Tote Bag', description: 'Heavy duty organic cotton bag', pointsRequired: 20, stock: 15, status: 'ACTIVE' }
  });
  await prisma.reward.create({
    data: { name: 'Bamboo Cutlery Set', description: 'Reusable lunch cutlery set', pointsRequired: 30, stock: 0, status: 'ACTIVE' }
  });
  await prisma.reward.create({
    data: { name: 'Carbon Offset Certificate', description: 'Offsets 1 ton of CO2', pointsRequired: 150, stock: 100, status: 'ACTIVE' }
  });
  await prisma.reward.create({
    data: { name: 'Desk Solar Charger', description: 'Eco friendly device charger', pointsRequired: 200, stock: 5, status: 'ACTIVE' }
  });
  await prisma.reward.create({
    data: { name: 'ESG Notebook', description: 'Recycled paper spiral notebook', pointsRequired: 40, stock: 12, status: 'ACTIVE' }
  });

  const audit1 = await prisma.audit.create({
    data: {
      title: 'Operations Audit Q2',
      departmentId: opsDept.id,
      auditorId: manager2.id,
      startDate: new Date('2026-04-10T00:00:00.000Z'),
      endDate: new Date('2026-04-15T00:00:00.000Z'),
      status: 'COMPLETED'
    }
  });
  const audit2 = await prisma.audit.create({
    data: {
      title: 'Logistics Safety Check',
      departmentId: logDept.id,
      auditorId: manager1.id,
      startDate: new Date('2026-05-10T00:00:00.000Z'),
      endDate: new Date('2026-05-12T00:00:00.000Z'),
      status: 'COMPLETED'
    }
  });
  const audit3 = await prisma.audit.create({
    data: {
      title: 'Manufacturing Emissions Audit',
      departmentId: mfgDept.id,
      auditorId: manager2.id,
      startDate: new Date('2026-07-20T00:00:00.000Z'),
      endDate: new Date('2026-07-22T00:00:00.000Z'),
      status: 'PLANNED'
    }
  });

  await prisma.complianceIssue.create({
    data: { ownerId: employees[0].id, severity: 'HIGH', description: 'Unlabeled recycling skips', status: 'RESOLVED', dueDate: new Date('2026-05-01T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[1].id, severity: 'HIGH', description: 'Fleet service records missing', status: 'OPEN', dueDate: new Date('2026-06-01T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[2].id, severity: 'MEDIUM', description: 'Faulty solar array panel #4', status: 'OPEN', dueDate: new Date('2026-07-01T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[3].id, severity: 'LOW', description: 'Acknowledge guidelines late', status: 'RESOLVED', dueDate: new Date('2026-07-05T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[4].id, severity: 'MEDIUM', description: 'Scrap metal leaks logistics', status: 'OPEN', dueDate: new Date('2026-06-15T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[5].id, severity: 'HIGH', description: 'Exceeded factory dust thresholds', status: 'OPEN', dueDate: new Date('2026-05-15T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[6].id, severity: 'LOW', description: 'Weekly reports missing QA', status: 'OPEN', dueDate: new Date('2026-07-10T00:00:00.000Z') }
  });
  await prisma.complianceIssue.create({
    data: { ownerId: employees[7].id, severity: 'MEDIUM', description: 'Waste container storage check', status: 'OPEN', dueDate: new Date('2026-08-15T00:00:00.000Z') }
  });

  const scoringPeriods = ['2026-05', '2026-06', '2026-07'];
  for (const period of scoringPeriods) {
    for (const dId of allDeptIds) {
      await persistDepartmentScore(dId, period);
    }
  }

  const deptCount = await prisma.department.count();
  const userCount = await prisma.user.count();
  const catCount = await prisma.category.count();
  const efCount = await prisma.emissionFactor.count();
  const goalCount = await prisma.environmentalGoal.count();
  const policyCount = await prisma.eSGPolicy.count();
  const ackCount = await prisma.policyAcknowledgement.count();
  const actCount = await prisma.cSRActivity.count();
  const challengeCount = await prisma.challenge.count();
  const badgeCount = await prisma.badge.count();
  const empBadgeCount = await prisma.employeeBadge.count();
  const rewardCount = await prisma.reward.count();
  const auditCount = await prisma.audit.count();
  const issueCount = await prisma.complianceIssue.count();
  const txCount = await prisma.carbonTransaction.count();
  const scoreCount = await prisma.departmentScore.count();

  console.log('====================================');
  console.log('       ECOSPHERE DATABASE SEED SUCCESS');
  console.log('====================================');
  console.log(`Departments created:       ${deptCount}`);
  console.log(`Users created:             ${userCount}`);
  console.log(`Categories created:        ${catCount}`);
  console.log(`Emission Factors created:  ${efCount}`);
  console.log(`Environmental Goals:       ${goalCount}`);
  console.log(`ESG Policies:              ${policyCount}`);
  console.log(`Policy Acknowledgements:   ${ackCount}`);
  console.log(`CSR Activities:            ${actCount}`);
  console.log(`Challenges:                ${challengeCount}`);
  console.log(`Badges:                    ${badgeCount}`);
  console.log(`Employee Badges:           ${empBadgeCount}`);
  console.log(`Rewards Catalog:           ${rewardCount}`);
  console.log(`Audits:                    ${auditCount}`);
  console.log(`Compliance Issues:         ${issueCount}`);
  console.log(`Carbon Transactions:       ${txCount}`);
  console.log(`Department Scores:         ${scoreCount}`);
  console.log('====================================');
  console.log('           DEMO LOGIN CREDENTIALS');
  console.log('====================================');
  console.log('ADMIN:');
  console.log('  Email:    admin@ecosphere.local');
  console.log('  Password: password123');
  console.log('ESG_MANAGER:');
  console.log('  Email:    sarah.j@ecosphere.local');
  console.log('  Password: password123');
  console.log('EMPLOYEE:');
  console.log('  Email:    employee1@ecosphere.local');
  console.log('  Password: password123');
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
