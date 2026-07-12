import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'];

    if (!userRole) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication credentials are required'));
    }

    const roleString = Array.isArray(userRole) ? userRole[0] : userRole;

    if (!allowedRoles.includes(roleString)) {
      return next(new AppError(403, 'FORBIDDEN', 'Access is denied'));
    }

    next();
  };
};
