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

router.post('/:id/acknowledge', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const employeeId = getEmployeeId(req);

  const ack = await prisma.policyAcknowledgement.findUnique({ where: { id } });
  if (!ack) {
    throw new AppError(404, 'NOT_FOUND', 'Policy acknowledgement record not found');
  }

  if (ack.employeeId !== employeeId) {
    throw new AppError(403, 'FORBIDDEN', 'You are not authorized to acknowledge this policy on behalf of this employee');
  }

  const updated = await prisma.policyAcknowledgement.update({
    where: { id },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date()
    }
  });

  res.json(updated);
}));

export default router;
