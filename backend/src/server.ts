import 'dotenv/config';
import app from './app';
import { config } from './config';

// ── Global error guards (prevent silent crashes) ──────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);

  // Load workers after server starts so startup errors are non-fatal
  try { require('./workers/email.worker'); } catch (e: any) { console.error('[Worker] email.worker failed:', e.message); }
  try { require('./workers/certificate.worker'); } catch (e: any) { console.error('[Worker] certificate.worker failed:', e.message); }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${config.port} is already in use. Stop the other instance first.`);
  } else {
    console.error('[FATAL] Server error:', err);
  }
  process.exit(1);
});
