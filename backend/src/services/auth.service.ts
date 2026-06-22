import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateAccessToken } from '../utils/jwt';
import { generateSecureToken, hashToken, generateRefreshToken, hashRefreshToken } from '../utils/tokenUtils';
import { queueEmail } from '../utils/queueEmail';
import { config } from '../config';
import { admin } from '../config/firebase';

export const AuthService = {

  /**
   * No row is written to "User" here. The signup is held in PendingRegistration
   * until the verification link is clicked — only then does a real User exist.
   */
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const hashed = await bcrypt.hash(password, 12);
    const rawVerificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Upsert by email — re-registering before verifying just replaces the pending signup
    await prisma.pendingRegistration.upsert({
      where: { email },
      create: { name, email, password: hashed, tokenHash: hashToken(rawVerificationToken), expiresAt: verificationExpires },
      update: { name, password: hashed, tokenHash: hashToken(rawVerificationToken), expiresAt: verificationExpires },
    });
    await queueEmail('verification-email', {
      to: email,
      name,
      token: rawVerificationToken,
      frontendUrl: config.frontendUrl,
    });
    return { name, email, role: 'STUDENT' };
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

  async logout(rawToken: string): Promise<{ userId: string | null }> {
    const tokenHash = hashRefreshToken(rawToken);
    // Resolve userId before deleting so the audit log has a real actorId.
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, select: { userId: true } });
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    return { userId: stored?.userId ?? null };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success — never reveal whether the email exists
    if (!user) return;
    const rawResetToken = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: hashToken(rawResetToken), resetPasswordExpires: expires },
    });
    await queueEmail('password-reset', {
      to: user.email,
      name: user.name,
      token: rawResetToken,
      frontendUrl: config.frontendUrl,
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });
    if (!user) throw new Error('INVALID_TOKEN');
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetTokenHash: null,
        resetPasswordExpires: null,
        isVerified: true,
        mustChangePassword: false,
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    });
    // Invalidate all existing sessions after a password reset
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    return { userId: user.id };
  },

  async resendVerificationEmail(email: string) {
    const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
    // Always behave as if it succeeded — never reveal whether a pending signup or verified account exists
    if (!pending) return;
    const rawVerificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Overwriting the hash/expiry invalidates the previous token (single active token per signup)
    await prisma.pendingRegistration.update({
      where: { email },
      data: { tokenHash: hashToken(rawVerificationToken), expiresAt: verificationExpires },
    });
    await queueEmail('verification-email', {
      to: pending.email,
      name: pending.name,
      token: rawVerificationToken,
      frontendUrl: config.frontendUrl,
    });
  },

  /**
   * The real User row is created here, on successful verification — not at registration time.
   */
  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const pending = await prisma.pendingRegistration.findUnique({ where: { tokenHash } });
    if (!pending) throw new Error('INVALID_TOKEN');
    if (pending.expiresAt < new Date()) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {});
      throw new Error('TOKEN_EXPIRED');
    }

    let user;
    try {
      user = await prisma.user.create({
        data: { name: pending.name, email: pending.email, password: pending.password, role: 'STUDENT', isVerified: true },
      });
    } catch (err: any) {
      // Someone else claimed this email between registration and verification (e.g. admin-created account)
      if (err.code === 'P2002') throw new Error('EMAIL_EXISTS');
      throw err;
    }

    await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    await queueEmail('welcome', { name: user.name, email: user.email });
    return { userId: user.id };
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
          data: { googleId: uid, isVerified: true, emailVerificationTokenHash: null, emailVerificationExpires: null },
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
