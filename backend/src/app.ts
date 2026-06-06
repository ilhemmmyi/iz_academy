import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { courseRouter } from './routes/course.routes';
import { enrollmentRouter } from './routes/enrollment.routes';
import { quizRouter } from './routes/quiz.routes';
import { uploadRouter } from './routes/upload.routes';
import { paymentRouter } from './routes/payment.routes';
import { messageRouter } from './routes/message.routes';
import { lessonRouter } from './routes/lesson.routes';
import { projectRouter } from './routes/project.routes';
import { lessonCommentRouter } from './routes/lessonComment.routes';
import { resourceRouter } from './routes/resource.routes';
import { contactMessageRouter } from './routes/contactMessage.routes';
import { reportRouter } from './routes/report.routes';
import { lessonResourceRouter } from './routes/lessonResource.routes';
import { aiRouter } from './routes/ai.routes';
import { activityRouter } from './routes/activity.routes';
import { settingsRouter } from './routes/settings.routes';
import { errorHandler } from './middlewares/error.middleware';
import { correlationIdMiddleware } from './middlewares/correlationId.middleware';
import { auditLogRouter } from './routes/auditLog.routes';
import { AuditService, extractRequestContext } from './services/audit.service';

// M-2 — N'initialiser Sentry que si le DSN est configuré
if (config.sentryDsn && !config.sentryDsn.includes('xxx')) {
  Sentry.init({ dsn: config.sentryDsn, environment: process.env.NODE_ENV });
}

const app = express();

// Trust the first upstream proxy hop so req.ip reflects the real client IP
// from X-Forwarded-For. Safe only when deployed behind a single reverse proxy
// (Nginx, AWS ALB, etc.). In development this is a no-op (direct connections).
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

// H-6 — Localhost uniquement en développement
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [config.frontendUrl]
  : [config.frontendUrl, 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(correlationIdMiddleware);

// Global rate limit — 200 req/min per IP (excludes auth routes which have stricter limits)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    AuditService.security({
      actorId: null,
      action: 'SECURITY.RATE_LIMIT',
      targetType: 'Route',
      targetId: req.path,
      payload: { method: req.method },
      ...extractRequestContext(req),
    });
    res.status(429).json({ success: false, error: 'Too many requests' });
  },
});
app.use(globalLimiter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/messages', messageRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/lessons', lessonCommentRouter);
app.use('/api/projects', projectRouter);
app.use('/api/courses', resourceRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contact-messages', contactMessageRouter);
app.use('/api/reports', reportRouter);
app.use('/api/lessons', lessonResourceRouter);
app.use('/api/activities', activityRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/audit-logs', auditLogRouter);

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
