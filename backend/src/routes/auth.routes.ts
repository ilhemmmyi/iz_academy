import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, googleLoginSchema, verify2FASchema } from '../validators/auth.validators';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();

const isDev = process.env.NODE_ENV !== 'production';
const loginLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: isDev ? 100 : 10, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: isDev ? 100 : 5, standardHeaders: true, legacyHeaders: false });

authRouter.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/google', loginLimiter, validate(googleLoginSchema), AuthController.googleLogin);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/2fa/setup', authenticate, AuthController.setup2FA);
authRouter.post('/2fa/verify', loginLimiter, validate(verify2FASchema), AuthController.verify2FA);
