import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, googleLoginSchema, resetPasswordSchema } from '../validators/auth.validators';
import {
  authLoginLimiter,
  authRegisterLimiter,
  authForgotPasswordLimiter,
  authResetPasswordLimiter,
  authRefreshLimiter,
} from '../middlewares/rate-limit.middleware';

export const authRouter = Router();

// GET — safe method, no CSRF token required, issues a fresh CSRF token pair
authRouter.get('/csrf-token', AuthController.getCsrfToken);

authRouter.get('/verify-email', AuthController.verifyEmail);
authRouter.post('/forgot-password', authForgotPasswordLimiter, AuthController.forgotPassword);
authRouter.post('/reset-password', authResetPasswordLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
authRouter.post('/register', authRegisterLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', authLoginLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/google', authLoginLimiter, validate(googleLoginSchema), AuthController.googleLogin);
authRouter.post('/refresh', authRefreshLimiter, AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
