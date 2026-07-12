import express from 'express';
import request from 'supertest';
import { prisma } from '../prisma';
import rewardsRouter from './rewards';
import { evaluateBadgesForEmployee } from '../services/gamification';
import { globalErrorHandler } from '../utils/errors';

const app = express();
app.use(express.json());
app.use('/api/rewards', rewardsRouter);
app.use(globalErrorHandler);

describe('Gamification Module Tests', () => {
  let employeeId: string;
  let badgeId: string;
  let rewardId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test Gamer',
        email: `gamer-${Date.now()}@ecosphere.local`,
        passwordHash: 'dummyhash',
        role: 'EMPLOYEE',
        pointsBalance: 0
      }
    });
    employeeId = user.id;

    const badge = await prisma.badge.create({
      data: {
        name: 'Test Elite Gamer Badge',
        description: 'Awarded for 100+ XP',
        unlockRuleJson: JSON.stringify({
          metric: 'XP',
          operator: '>=',
          value: 100
        }),
        iconUrl: 'badge-icon.png'
      }
    });
    badgeId = badge.id;

    const reward = await prisma.reward.create({
      data: {
        name: 'Test Reward Drink',
        description: 'A refreshing soda',
        pointsRequired: 50,
        stock: 1,
        status: 'ACTIVE'
      }
    });
    rewardId = reward.id;
  });

  afterAll(async () => {
    await prisma.employeeBadge.deleteMany({
      where: { employeeId }
    });
    await prisma.pointsLedgerEntry.deleteMany({
      where: { employeeId }
    });
    await prisma.redemption.deleteMany({
      where: { employeeId }
    });
    await prisma.user.delete({
      where: { id: employeeId }
    });
    await prisma.badge.delete({
      where: { id: badgeId }
    });
    await prisma.reward.delete({
      where: { id: rewardId }
    });
  });

  it('should evaluate badges and ensure idempotency', async () => {
    await prisma.pointsLedgerEntry.create({
      data: {
        employeeId,
        delta: 120,
        reason: 'CSR_APPROVAL'
      }
    });

    const firstAwards = await evaluateBadgesForEmployee(employeeId);
    expect(firstAwards.some(a => a.badgeId === badgeId)).toBe(true);

    const secondAwards = await evaluateBadgesForEmployee(employeeId);
    expect(secondAwards.some(a => a.badgeId === badgeId)).toBe(false);

    const dbBadges = await prisma.employeeBadge.findMany({
      where: { employeeId, badgeId }
    });
    expect(dbBadges.length).toBe(1);
  });

  it('should fail reward redemption if employee points balance is insufficient', async () => {
    await prisma.user.update({
      where: { id: employeeId },
      data: { pointsBalance: 10 }
    });

    const response = await request(app)
      .post(`/api/rewards/${rewardId}/redeem`)
      .set('x-user-id', employeeId)
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Insufficient points balance');
  });

  it('should fail reward redemption if stock is 0', async () => {
    await prisma.user.update({
      where: { id: employeeId },
      data: { pointsBalance: 100 }
    });

    const firstRedeem = await request(app)
      .post(`/api/rewards/${rewardId}/redeem`)
      .set('x-user-id', employeeId)
      .send();

    expect(firstRedeem.status).toBe(200);

    const secondRedeem = await request(app)
      .post(`/api/rewards/${rewardId}/redeem`)
      .set('x-user-id', employeeId)
      .send();

    expect(secondRedeem.status).toBe(400);
    expect(secondRedeem.body).toHaveProperty('error');
    expect(secondRedeem.body.error).toHaveProperty('message', 'Reward is out of stock');
  });
});
