import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { queueEmail } from '../utils/queueEmail';
import { EmailService } from '../utils/email';
import { config } from '../config';
import { admin } from '../config/firebase';

export const AuthService = {

  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const user = await prisma.user.create({
      data: {
        name, email, password: hashed, role: 'STUDENT',
        isVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });
    EmailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
      frontendUrl: config.frontendUrl,
    }).catch((err) => console.error('[register] Verification email error:', err));
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (!user.password) throw new Error('INVALID_CREDENTIALS');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    if (!user.isVerified) throw new Error('EMAIL_NOT_VERIFIED');
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
    verifyRefreshToken(token);
    await prisma.refreshToken.delete({ where: { token } });
    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    // H-3 — Vérifier isActive ET isVerified au refresh
    if (!user || !user.isActive || !user.isVerified) throw new Error('INVALID_REFRESH');
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

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success — never reveal whether the email exists
    if (!user || !user.isActive) return;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });
    EmailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
      frontendUrl: config.frontendUrl,
    }).catch((err) => console.error('[forgotPassword] Email error:', err));
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { resetPasswordToken: token } });
    if (!user) throw new Error('INVALID_TOKEN');
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        isVerified: true,
        mustChangePassword: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  },

  async verifyEmail(token: string) {
    const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
    if (!user) throw new Error('INVALID_TOKEN');
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
    });
    await queueEmail('welcome', { name: user.name, email: user.email });
  },

  async googleLogin(uid: string, email: string, displayName: string, firebaseToken: string) {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    if (decoded.uid !== uid || decoded.email !== email) {
      throw new Error('INVALID_FIREBASE_TOKEN');
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: uid }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: uid, isVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
        });
      }
      if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    } else {
      user = await prisma.user.create({
        data: { name: displayName, email, googleId: uid, role: 'STUDENT', isVerified: true },
      });
      await queueEmail('welcome', { name: user.name, email: user.email });
    }

    return user;
  },
};
