import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { emailQueue } from '../queues/email.queue';
import { EmailService } from '../utils/email';
import { config } from '../config';
import { admin } from '../config/firebase';

export const AuthService = {

  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
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
    // Single query: fetch token + user in one round trip
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');
    verifyRefreshToken(token); // validate signature (in-memory, no DB)
    if (!stored.user || !stored.user.isActive) throw new Error('INVALID_REFRESH');

    // Delete old token + create new tokens in parallel (independent operations)
    const [tokens] = await Promise.all([
      this.issueTokens(stored.user.id, stored.user.role, stored.user.email),
      prisma.refreshToken.delete({ where: { token } }),
    ]);
    return tokens;
  },

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
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
    emailQueue.add('welcome', { name: user.name, email: user.email }).catch((err) => console.error('Email queue error:', err));
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
          data: { googleId: uid },
        });
      }
      if (!user.isActive) throw new Error('ACCOUNT_DISABLED');
    } else {
      user = await prisma.user.create({
        data: { name: displayName, email, googleId: uid, role: 'STUDENT', isVerified: true },
      });
      emailQueue.add('welcome', { name: user.name, email: user.email }).catch((err) => console.error('Email queue error:', err));
    }

    return user;
  },
};
