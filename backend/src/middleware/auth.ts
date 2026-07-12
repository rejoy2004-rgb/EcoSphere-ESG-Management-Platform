import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-38c21a4e';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    departmentId: string | null;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Access token required'));
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Access token required'));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return next(new AppError(403, 'FORBIDDEN', 'Invalid or expired token'));
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      departmentId: decoded.departmentId
    };
    next();
  });
}

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
