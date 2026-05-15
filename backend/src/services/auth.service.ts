import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { emailQueue } from '../queues/email.queue';
import { admin } from '../config/firebase';

export const AuthService = {

  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'STUDENT' },
    });
    // Queue welcome email (fire-and-forget — Redis may be unavailable in dev)
    emailQueue.add('welcome', { name: user.name, email: user.email }).catch((err) => console.error('Email queue error:', err));
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (!user.password) throw new Error('INVALID_CREDENTIALS');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    return user;
  },

  async issueTokens(userId: string, role: string, email: string) {
    const payload = { userId, role, email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId, expiresAt } });
    return { accessToken, refreshToken };
  },

  async refresh(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');
    verifyRefreshToken(token); // validate signature
    await prisma.refreshToken.delete({ where: { token } });
    // Re-fetch user from DB to get current role and active status
    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) throw new Error('INVALID_REFRESH');
    return this.issueTokens(user.id, user.role, user.email);
  },

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async setup2FA(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'IzAcademy' });
    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
    return { qrCode };
  },

  async verify2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new Error('2FA_NOT_SETUP');
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret, encoding: 'base32', token, window: 1,
    });
    if (!valid) throw new Error('INVALID_2FA_TOKEN');
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return true;
  },

  async googleLogin(uid: string, email: string, displayName: string, firebaseToken: string) {
    // 1. Verify the Firebase ID token server-side
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    if (decoded.uid !== uid || decoded.email !== email) {
      throw new Error('INVALID_FIREBASE_TOKEN');
    }

    // 2. Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: uid }, { email }] },
    });

    if (user) {
      // Link the Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: uid },
        });
      }
      if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    } else {
      // 3. Create a new user (no password required)
      user = await prisma.user.create({
        data: { name: displayName, email, googleId: uid, role: 'STUDENT' },
      });
      emailQueue.add('welcome', { name: user.name, email: user.email }).catch((err) => console.error('Email queue error:', err));
    }

    return user;
  },
};
