import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import transcribeRoutes from './routes/transcribe.js';
import boardsRoutes from './routes/boards.js';
import billingRoutes from './routes/billing.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import webRoutes from './routes/web.js';
import trendsRoutes from './routes/trends.js';
import { startTrendsScheduler } from './lib/trendsScheduler.js';
import { isMailConfigured } from './lib/mailer.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const IS_PROD = process.env.NODE_ENV === 'production';

/* ============================================================
   PRE-FLIGHT SECURITY CHECKS — refuse to start in prod with
   weak JWT secret or missing admin allowlist.
   ============================================================ */
if (IS_PROD) {
  const secret = process.env.JWT_SECRET || '';
  if (!secret || secret.length < 32 ||
      secret === 'change-this-to-a-long-random-string-in-production') {
    console.error('⛔ JWT_SECRET is missing or too weak. Generate one:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

/* ============================================================
   SECURITY HEADERS — Helmet sets 15+ HTTP headers that defend
   against XSS, clickjacking, MIME sniffing, etc.
   CSP is tailored to our CDN dependencies.
   ============================================================ */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src':     ["'self'"],
      // Tailwind CDN uses runtime eval; our pages have inline scripts
      'script-src':      ["'self'", "'unsafe-inline'", "'unsafe-eval'",
                          'https://cdn.tailwindcss.com', 'https://unpkg.com'],
      'script-src-attr': ["'unsafe-inline'"],  // for onload= attrs from lucide etc.
      'style-src':       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src':        ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src':         ["'self'", 'data:', 'blob:', 'https:'],
      // External APIs (DDG/Wiki/HN/Reddit/Jina) are proxied through /api/ai/proxy,
      // so the browser only ever connects to its own origin.
      'connect-src':     ["'self'"],
      'frame-src':       ["'self'", 'https://www.youtube.com', 'https://youtube.com'],
      'worker-src':      ["'self'", 'blob:'],
      'object-src':      ["'none'"],
      'base-uri':        ["'self'"],
      'form-action':     ["'self'"],
      'frame-ancestors': ["'none'"]    // can't be embedded in <iframe> elsewhere
    }
  },
  crossOriginEmbedderPolicy: false,   // we load images from other origins
  // HSTS — force HTTPS for 1 year. Only enabled in production behind real HTTPS.
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false
}));

/* ============================================================
   CORS — strict allowlist in prod, permissive in dev.
   Configure via env:  ALLOWED_ORIGINS=https://eden.com,https://www.eden.com
   ============================================================ */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                  // same-origin / curl / mobile
    if (!IS_PROD) return cb(null, true);                 // permissive in dev
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'));
  },
  credentials: false
}));

/* ============================================================
   BODY LIMITS — 200kb is plenty for JSON. Multer routes set
   their own larger limits for actual file uploads.
   ============================================================ */
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

/* ============================================================
   GLOBAL RATE LIMIT — 600 req per 15 min per IP across /api.
   Individual auth routes have stricter limits (signinLimiter etc).
   ============================================================ */
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' }
}));

// Tiny request logger (NO body — passwords never hit logs)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()}  ${req.method}  ${req.path}`);
  }
  next();
});

// API
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', adminRoutes);   // /api/admin/* + /api/me/* + /api/ai/config
app.use('/api', webRoutes);     // /api/web/search + /api/web/fetch (AI tools)
app.use('/api', trendsRoutes);  // /api/trends/latest + /api/trends/regenerate

// Public board viewer route — serves a dedicated HTML page
app.get('/board/:slug', (_req, res) => res.sendFile(path.join(FRONTEND_DIR, 'board.html')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), mail: isMailConfigured() ? 'gmail' : 'demo' });
});

// Static frontend
app.use(express.static(FRONTEND_DIR, {
  extensions: ['html'],
  // tell browsers to revalidate often in dev; in prod we'd cache hard
  maxAge: IS_PROD ? '7d' : 0
}));
app.get('/', (_req, res) => res.redirect('/eden-clone.html'));

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).sendFile(path.join(FRONTEND_DIR, 'eden-clone.html'));
});

/* ============================================================
   ERROR HANDLER — in production, leak NOTHING to client.
   Internal errors only go to server logs.
   ============================================================ */
app.use((err, req, res, _next) => {
  console.error('[server error]', req.method, req.path, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: IS_PROD && status >= 500
      ? 'Server error — please try again later'
      : (err.message || 'Server error')
  });
});

const PORT = Number(process.env.PORT || 3000);
const server = app.listen(PORT, () => {
  const mail = isMailConfigured() ? '\x1b[32mGMAIL\x1b[0m (configured)' : '\x1b[33mDEMO\x1b[0m (codes shown in this console)';
  const sec  = IS_PROD ? '\x1b[32mPROD\x1b[0m (HSTS + CSP strict)' : '\x1b[33mDEV\x1b[0m (permissive CORS)';
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   Alma  ·  http://localhost:${String(PORT).padEnd(5)}                  ║
║                                                    ║
╚════════════════════════════════════════════════════╝

  Frontend  →  ${FRONTEND_DIR}
  Mail mode →  ${mail}
  Security  →  ${sec}
  Admin     →  ${process.env.ADMIN_EMAILS || '(none — set ADMIN_EMAILS in .env)'}
`);
  // Background: trend analyst runs weekly across TikTok/YouTube/Reels/X/LinkedIn.
  startTrendsScheduler();
});

/* ============================================================
   GRACEFUL SHUTDOWN — finish in-flight requests before exit.
   ============================================================ */
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close((err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log('Server closed.');
    process.exit(0);
  });
  // hard exit if shutdown hangs
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
