import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          fields[path] = issue.message;
        }
        return next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', fields));
      }
      next(error);
    }
  };
};
