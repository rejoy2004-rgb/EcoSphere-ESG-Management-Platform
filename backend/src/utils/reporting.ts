import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReportFilters {
  departmentId?: string;
  dateRange?: {
    start?: string | Date;
    end?: string | Date;
  };
  module?: 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE' | 'GAMIFICATION' | string;
  employeeId?: string;
  challengeId?: string;
  esgCategory?: string;
}

export async function buildReportDataset(filters: ReportFilters) {
  const { departmentId, dateRange, module, employeeId, challengeId, esgCategory } = filters;
  const start = dateRange?.start ? new Date(dateRange.start) : undefined;
  const end = dateRange?.end ? new Date(dateRange.end) : undefined;

  const result: {
    carbonTransactions: any[];
    csrActivities: any[];
    csrParticipations: any[];
    audits: any[];
    complianceIssues: any[];
    challenges: any[];
    challengeParticipations: any[];
  } = {
    carbonTransactions: [],
    csrActivities: [],
    csrParticipations: [],
    audits: [],
    complianceIssues: [],
    challenges: [],
    challengeParticipations: []
  };

  const includeEnv = !module || module === 'ENVIRONMENTAL';
  const includeSoc = !module || module === 'SOCIAL';
  const includeGov = !module || module === 'GOVERNANCE';
  const includeGam = !module || module === 'GAMIFICATION';

  if (includeEnv) {
    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (employeeId) {
      where.createdById = employeeId;
    }
    if (start || end) {
      where.transactionDate = {};
      if (start) where.transactionDate.gte = start;
      if (end) where.transactionDate.lte = end;
    }
    result.carbonTransactions = await prisma.carbonTransaction.findMany({
      where,
      include: { department: true, emissionFactor: true, createdBy: true }
    });
  }

  if (includeSoc) {
    const actWhere: any = {};
    if (departmentId) {
      actWhere.departmentId = departmentId;
    }
    if (start || end) {
      actWhere.date = {};
      if (start) actWhere.date.gte = start;
      if (end) actWhere.date.lte = end;
    }
    if (esgCategory) {
      actWhere.categoryId = esgCategory;
    }
    result.csrActivities = await prisma.cSRActivity.findMany({
      where: actWhere,
      include: { department: true, category: true }
    });

    const partWhere: any = {};
    if (employeeId) {
      partWhere.employeeId = employeeId;
    }
    if (departmentId) {
      partWhere.activity = { departmentId };
    }
    if (start || end) {
      partWhere.createdAt = {};
      if (start) partWhere.createdAt.gte = start;
      if (end) partWhere.createdAt.lte = end;
    }
    result.csrParticipations = await prisma.employeeParticipation.findMany({
      where: partWhere,
      include: { employee: true, activity: { include: { department: true } } }
    });
  }

  if (includeGov) {
    const auditWhere: any = {};
    if (departmentId) {
      auditWhere.departmentId = departmentId;
    }
    if (employeeId) {
      auditWhere.auditorId = employeeId;
    }
    if (start || end) {
      auditWhere.startDate = {};
      if (start) auditWhere.startDate.gte = start;
      if (end) auditWhere.startDate.lte = end;
    }
    result.audits = await prisma.audit.findMany({
      where: auditWhere,
      include: { department: true, auditor: true }
    });

    const issueWhere: any = {};
    if (employeeId) {
      issueWhere.ownerId = employeeId;
    }
    if (departmentId) {
      issueWhere.audit = { departmentId };
    }
    if (start || end) {
      issueWhere.dueDate = {};
      if (start) issueWhere.dueDate.gte = start;
      if (end) issueWhere.dueDate.lte = end;
    }
    result.complianceIssues = await prisma.complianceIssue.findMany({
      where: issueWhere,
      include: { owner: true, audit: { include: { department: true } } }
    });
  }

  if (includeGam) {
    const chalWhere: any = {};
    if (challengeId) {
      chalWhere.id = challengeId;
    }
    if (esgCategory) {
      chalWhere.categoryId = esgCategory;
    }
    if (start || end) {
      chalWhere.createdAt = {};
      if (start) chalWhere.createdAt.gte = start;
      if (end) chalWhere.createdAt.lte = end;
    }
    result.challenges = await prisma.challenge.findMany({
      where: chalWhere,
      include: { category: true }
    });

    const partWhere: any = {};
    if (employeeId) {
      partWhere.employeeId = employeeId;
    }
    if (challengeId) {
      partWhere.challengeId = challengeId;
    }
    if (start || end) {
      partWhere.createdAt = {};
      if (start) partWhere.createdAt.gte = start;
      if (end) partWhere.createdAt.lte = end;
    }
    result.challengeParticipations = await prisma.challengeParticipation.findMany({
      where: partWhere,
      include: { employee: true, challenge: { include: { category: true } } }
    });
  }

  return result;
}
