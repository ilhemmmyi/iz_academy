// Validate required secrets at startup — crash early if missing
const required = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'REDIS_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
] as const;

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  frontendUrl: process.env.FRONTEND_URL!,
  redisUrl: process.env.REDIS_URL!,
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'iz-academy',
  },
  resendApiKey: process.env.RESEND_API_KEY!,
  emailFrom: process.env.EMAIL_FROM!,
  emailAppPassword: process.env.EMAIL_APP_PASSWORD!,
  sentryDsn: process.env.SENTRY_DSN!,
};
