import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler, AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const getEmployeeId = (req: AuthenticatedRequest): string => {
  const headerId = req.headers['x-user-id'] || req.headers['x-employee-id'];
  const finalId = req.user?.id || (Array.isArray(headerId) ? headerId[0] : headerId);
  if (!finalId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Employee identification is required');
  }
  return finalId as string;
};

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const employeeId = getEmployeeId(req);
  const acks = await prisma.policyAcknowledgement.findMany({
    where: { employeeId },
    include: { policy: true }
  });
  res.json(acks);
}));

export default router;
