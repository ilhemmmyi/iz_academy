import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

export const auditLogRouter = Router();

// GET /api/audit-logs?page=1&limit=50&action=AUTH.LOGIN&actorId=xxx&targetType=User&from=ISO&to=ISO
// ADMIN only — audit logs contain sensitive operational data
auditLogRouter.get('/', authenticate, requireRole('ADMIN'), AuditLogController.query);
