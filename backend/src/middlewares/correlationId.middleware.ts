import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a UUID correlation ID to every request.
 *   - Reads X-Correlation-Id header if already set by a proxy/gateway.
 *   - Generates a fresh UUID otherwise.
 *   - Reflects the ID back in the response header so clients can correlate logs.
 *
 * Access via (req as any).correlationId in controllers/services.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers['x-correlation-id'];
  const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
  (req as any).correlationId = id;
  res.setHeader('X-Correlation-Id', id);
  next();
}
