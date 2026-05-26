import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { generateAccessToken } from '../utils/jwt';
import { generateRefreshToken, hashRefreshToken } from '../utils/tokenUtils';
import { queueEmail } from '../utils/queueEmail';
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
    await queueEmail('verification-email', {
      to: user.email,
      name: user.name,
      token: verificationToken,
      frontendUrl: config.frontendUrl,
    });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (!user.password) throw new Error('INVALID_CREDENTIALS');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    if (!user.isVerified) throw new Error('EMAIL_NOT_VERIFIED');
    return user;
  },

  /**
   * Generate an access token (JWT) + a refresh token (opaque random bytes).
   * Only the SHA-256 hash of the refresh token is persisted — the raw token
   * is returned to the caller and sent to the client via an httpOnly cookie.
   */
  async issueTokens(userId: string, role: string, email: string) {
    const accessToken = generateAccessToken({ userId, role, email });
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
    // Return raw token — it exists only in memory and in the client cookie
    return { accessToken, refreshToken: rawRefreshToken };
  },

  async refresh(rawToken: string) {
    const tokenHash = hashRefreshToken(rawToken);
    // Single query: fetch stored hash + user in one round trip
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) throw new Error('INVALID_REFRESH');
    if (!stored.user || !stored.user.isVerified) throw new Error('INVALID_REFRESH');

    // Token rotation: atomically delete old hash and issue new tokens.
    // Prevents replay attacks — each refresh token is single-use.
    const [tokens] = await Promise.all([
      this.issueTokens(stored.user.id, stored.user.role, stored.user.email),
      prisma.refreshToken.delete({ where: { tokenHash } }),
    ]);
    return tokens;
  },

  async logout(rawToken: string) {
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success — never reveal whether the email exists
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });
    await queueEmail('password-reset', {
      to: user.email,
      name: user.name,
      token,
      frontendUrl: config.frontendUrl,
    });
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
    // Invalidate all existing sessions after a password reset
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
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
    } else {
      user = await prisma.user.create({
        data: { name: displayName, email, googleId: uid, role: 'STUDENT', isVerified: true },
      });
      await queueEmail('welcome', { name: user.name, email: user.email });
    }

    return user;
  },
};
