import express from 'express';
import request from 'supertest';
import complianceIssuesRouter from './complianceIssues';
import { globalErrorHandler } from '../utils/errors';

const app = express();
app.use(express.json());
app.use('/api/compliance-issues', complianceIssuesRouter);
app.use(globalErrorHandler);

describe('Compliance Issue Validation', () => {
  it('should return 400 validation error when ownerId is missing', async () => {
    const response = await request(app)
      .post('/api/compliance-issues')
      .set('x-user-role', 'ADMIN')
      .send({
        severity: 'MEDIUM',
        description: 'Test issue without owner ID',
        dueDate: '2026-12-31T23:59:59.000Z'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('ownerId');
  });

  it('should return 400 validation error when dueDate is missing', async () => {
    const response = await request(app)
      .post('/api/compliance-issues')
      .set('x-user-role', 'ADMIN')
      .send({
        severity: 'HIGH',
        description: 'Test issue without due date',
        ownerId: 'some-user-id'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('dueDate');
  });
});
