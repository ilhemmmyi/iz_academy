import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

/** Hard auth — rejects the request if the token is missing or invalid. */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Soft auth — populates req.user when a valid Bearer token is present,
 * but never blocks the request. Used on public routes that need to
 * behave differently for authenticated users (e.g. version-aware content).
 */
export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Invalid token — treat as unauthenticated, continue.
    }
  }
  next();
};
