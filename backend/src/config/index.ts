// Validate required secrets at startup — crash early with a clear message if missing
const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'REDIS_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SMTP_USER',
  'SMTP_PASS',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n[FATAL] Missing required environment variables:\n  ${missing.join('\n  ')}`);
  console.error('\nCopy backend/.env.example to backend/.env and fill in all values.\n');
  process.exit(1);
}

// Warn if JWT secrets look like the example placeholders
const jwtAccess = process.env.JWT_ACCESS_SECRET!;
const jwtRefresh = process.env.JWT_REFRESH_SECRET!;
if (
  process.env.NODE_ENV === 'production' &&
  (jwtAccess.includes('CHANGE_ME') || jwtAccess.length < 32 ||
   jwtRefresh.includes('CHANGE_ME') || jwtRefresh.length < 32)
) {
  console.error('[FATAL] JWT secrets appear to be placeholder values. Generate strong secrets before running in production.');
  process.exit(1);
}

// Warn if AUDIT_HMAC_SECRET is missing — checksums will be skipped, not fatal.
if (!process.env.AUDIT_HMAC_SECRET) {
  console.warn('[config] AUDIT_HMAC_SECRET is not set — audit log checksums will be disabled.');
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtAccessSecret: jwtAccess,
  jwtRefreshSecret: jwtRefresh,
  auditHmacSecret: process.env.AUDIT_HMAC_SECRET || null,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  frontendUrl: process.env.FRONTEND_URL!,
  redisUrl: process.env.REDIS_URL!,
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'iz-solution',
  },
  emailFrom: process.env.EMAIL_FROM || 'IZ Academy <noreply@izacademy.com>',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  resendApiKey: process.env.RESEND_API_KEY || '',
  sentryDsn: process.env.SENTRY_DSN || '',
  quizPassThreshold: Number(process.env.QUIZ_PASS_THRESHOLD) || 80,
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  huggingFaceModel: process.env.HUGGINGFACE_MODEL || 'microsoft/Phi-3.5-mini-instruct',
  rateLimits: {
    authMax:         Number(process.env.RATE_LIMIT_AUTH_MAX)        || 5,
    uploadMax:       Number(process.env.RATE_LIMIT_UPLOAD_MAX)      || 20,
    certificateMax:  Number(process.env.RATE_LIMIT_CERTIFICATE_MAX) || 5,
  },
};
