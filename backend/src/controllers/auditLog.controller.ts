import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuditService } from '../services/audit.service';

export const AuditLogController = {

  async query(req: AuthRequest, res: Response) {
    try {
      const page   = Math.max(1, Number(req.query.page)  || 1);
      const limit  = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);
      const actorId    = req.query.actorId    as string | undefined;
      const action     = req.query.action     as string | undefined;
      const targetType = req.query.targetType as string | undefined;
      const targetId   = req.query.targetId   as string | undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to   = req.query.to   ? new Date(req.query.to   as string) : undefined;

      if (from && isNaN(from.getTime())) return res.status(400).json({ message: 'Invalid "from" date' });
      if (to   && isNaN(to.getTime()))   return res.status(400).json({ message: 'Invalid "to" date' });

      const result = await AuditService.query({ actorId, action, targetType, targetId, from, to, page, limit });
      res.json(result);
    } catch {
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  },
};
