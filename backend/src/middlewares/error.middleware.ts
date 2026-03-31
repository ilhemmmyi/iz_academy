import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  Sentry.captureException(err);
  console.error(err);
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600
    ? err.status
    : 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
