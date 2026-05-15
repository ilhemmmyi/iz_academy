import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(fieldErrors).flat()[0] || 'Données invalides';
      return res.status(400).json({ message: firstMessage, errors: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
