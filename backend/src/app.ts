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
import { errorHandler } from './middlewares/error.middleware';

Sentry.init({ dsn: config.sentryDsn, environment: process.env.NODE_ENV });

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Global rate limit — 200 req/min per IP (excludes auth routes which have stricter limits)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/contact-messages', contactMessageRouter);

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
