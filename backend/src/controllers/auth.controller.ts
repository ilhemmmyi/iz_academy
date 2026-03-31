import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const AuthController = {

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const user = await AuthService.register(name, email, password);
      res.status(201).json({ message: 'Account created', user });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') return res.status(409).json({ message: 'Email already in use' });
      console.error('[register]', err);
      res.status(500).json({ message: 'Registration failed' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.login(email, password);
      if (user.twoFactorEnabled) {
        return res.json({ requires2FA: true, userId: user.id });
      }
      const { accessToken, refreshToken } = await AuthService.issueTokens(user.id, user.role, user.email);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      });
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') return res.status(401).json({ message: 'Invalid credentials' });
      if (err.message === 'ACCOUNT_DISABLED') return res.status(403).json({ message: 'Account disabled' });
      console.error('[login]', err);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: 'No refresh token' });
      const tokens = await AuthService.refresh(token);
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({ accessToken: tokens.accessToken });
    } catch {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies.refreshToken;
    if (token) await AuthService.logout(token);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  },

  async setup2FA(req: AuthRequest, res: Response) {
    try {
      const result = await AuthService.setup2FA(req.user!.userId);
      res.json(result);
    } catch {
      res.status(500).json({ message: '2FA setup failed' });
    }
  },

  async verify2FA(req: Request, res: Response) {
    try {
      const { userId, token } = req.body;
      await AuthService.verify2FA(userId, token);
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const tokens = await AuthService.issueTokens(user.id, user.role, user.email);
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({ accessToken: tokens.accessToken });
    } catch {
      res.status(400).json({ message: 'Invalid 2FA token' });
    }
  },

  async googleLogin(req: Request, res: Response) {
    try {
      const { uid, email, displayName, firebaseToken } = req.body;
      if (!uid || !email || !displayName || !firebaseToken) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      const user = await AuthService.googleLogin(uid, email, displayName, firebaseToken);
      const { accessToken, refreshToken } = await AuthService.issueTokens(user.id, user.role, user.email);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      });
    } catch (err: any) {
      if (err.message === 'INVALID_FIREBASE_TOKEN') return res.status(401).json({ message: 'Invalid Firebase token' });
      if (err.message === 'ACCOUNT_DISABLED') return res.status(403).json({ message: 'Account disabled' });
      console.error('[googleLogin]', err);
      res.status(500).json({ message: 'Google login failed' });
    }
  },
};
