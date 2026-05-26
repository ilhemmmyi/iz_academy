import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuditService, extractRequestContext } from '../services/audit.service';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      AuditService.security({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'SECURITY.FORBIDDEN_ACCESS',
        targetType: 'Route',
        targetId: req.path,
        payload: { requiredRoles: roles, method: req.method },
        ...extractRequestContext(req),
      });
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};
