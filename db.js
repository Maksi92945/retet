import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'eden.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email          TEXT PRIMARY KEY,
    nick           TEXT NOT NULL,
    password_hash  TEXT NOT NULL,
    verified       INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_codes (
    email          TEXT PRIMARY KEY,
    code           TEXT NOT NULL,
    purpose        TEXT NOT NULL DEFAULT 'verify',  -- verify | reset
    attempts       INTEGER NOT NULL DEFAULT 0,
    expires_at     INTEGER NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token          TEXT PRIMARY KEY,
    email          TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at     INTEGER NOT NULL,
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_codes_expires ON pending_codes(expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS boards (
    id            TEXT PRIMARY KEY,
    slug          TEXT NOT NULL UNIQUE,
    owner_email   TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT DEFAULT '',
    is_public     INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS board_items (
    id            TEXT PRIMARY KEY,
    board_id      TEXT NOT NULL,
    kind          TEXT NOT NULL,        -- 'idea' | 'post' | 'url' | 'note' | 'creator'
    payload       TEXT NOT NULL,        -- JSON blob
    position      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS board_follows (
    follower_email  TEXT NOT NULL,
    board_id        TEXT NOT NULL,
    followed_at     TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_email, board_id),
    FOREIGN KEY (follower_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_email);
  CREATE INDEX IF NOT EXISTS idx_boards_public ON boards(is_public);
  CREATE INDEX IF NOT EXISTS idx_items_board ON board_items(board_id);
  CREATE INDEX IF NOT EXISTS idx_follows_user ON board_follows(follower_email);

  /* ============================================================
     audit_log — every privileged action gets recorded.
     Lets you (or auditors) see who did what, when, against whom.
     ============================================================ */
  CREATE TABLE IF NOT EXISTS audit_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    at            TEXT NOT NULL DEFAULT (datetime('now')),
    actor_email   TEXT NOT NULL,
    action        TEXT NOT NULL,           -- 'block_user' | 'delete_user' | 'set_subscription' | 'force_logout' | ...
    target_email  TEXT,
    detail        TEXT,                    -- JSON blob with extras
    ip            TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_audit_at     ON audit_log(at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_log(actor_email);
  CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_email);

  /* ============================================================
     Useful indexes for admin queries
     ============================================================ */
  CREATE INDEX IF NOT EXISTS idx_users_blocked      ON users(blocked);
  CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription);
  CREATE INDEX IF NOT EXISTS idx_users_last_seen    ON users(last_seen DESC);
  CREATE INDEX IF NOT EXISTS idx_users_created_at   ON users(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_items_kind         ON board_items(kind);

  /* ============================================================
     ai_config — single-row table holding the admin-set AI engine
     config used by every user. So the owner pastes the Groq /
     OpenAI key once, all users get AI without ever seeing a key.
     ============================================================ */
  CREATE TABLE IF NOT EXISTS ai_config (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    engine      TEXT NOT NULL DEFAULT 'groq',
    base_url    TEXT NOT NULL DEFAULT 'https://api.groq.com/openai/v1',
    model       TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
    api_key     TEXT DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by  TEXT
  );
  INSERT OR IGNORE INTO ai_config (id) VALUES (1);

  /* ============================================================
     user_profile — extended profile beyond auth (name, avatar,
     niche, audience, current project) — fed into the AI as context.
     ============================================================ */
  CREATE TABLE IF NOT EXISTS user_profile (
    email           TEXT PRIMARY KEY,
    display_name    TEXT DEFAULT '',
    avatar_data_url TEXT DEFAULT '',
    about           TEXT DEFAULT '',
    audience        TEXT DEFAULT '',
    project         TEXT DEFAULT '',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );

  /* ============================================================
     user_prefs — per-user UI prefs (theme, editor, etc.)
     ============================================================ */
  CREATE TABLE IF NOT EXISTS user_prefs (
    email                TEXT PRIMARY KEY,
    theme                TEXT NOT NULL DEFAULT 'dark',     -- 'dark' | 'light' | 'system'
    confirm_delete_board INTEGER NOT NULL DEFAULT 1,
    confirm_delete_chat  INTEGER NOT NULL DEFAULT 1,
    autoclose_brackets   INTEGER NOT NULL DEFAULT 1,
    spellcheck           INTEGER NOT NULL DEFAULT 0,
    spellcheck_lang      TEXT NOT NULL DEFAULT 'en',
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
  );
`);

/* ============================================================
   Idempotent column migrations — safe to call on every boot.
   Adds new columns to `users` without losing data.
   ============================================================ */
function ensureColumn(table, name, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find(c => c.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn('users', 'blocked',             "blocked INTEGER NOT NULL DEFAULT 0");
ensureColumn('users', 'subscription',        "subscription TEXT NOT NULL DEFAULT 'free'");
ensureColumn('users', 'subscription_until',  "subscription_until TEXT");
ensureColumn('users', 'last_seen',           "last_seen TEXT");
ensureColumn('users', 'password_changed_at', "password_changed_at TEXT");
ensureColumn('users', 'bcrypt_cost',         "bcrypt_cost INTEGER NOT NULL DEFAULT 10");

// --- billing / subscription ---
ensureColumn('users', 'is_trial',          "is_trial INTEGER NOT NULL DEFAULT 0");
ensureColumn('users', 'trial_used',        "trial_used INTEGER NOT NULL DEFAULT 0");
ensureColumn('users', 'plan_started_at',   "plan_started_at INTEGER");
ensureColumn('users', 'plan_expires_at',   "plan_expires_at INTEGER");
ensureColumn('users', 'tokens_daily',      "tokens_daily INTEGER NOT NULL DEFAULT 0");
ensureColumn('users', 'tokens_balance',    "tokens_balance INTEGER NOT NULL DEFAULT 0");
ensureColumn('users', 'tokens_reset_at',   "tokens_reset_at INTEGER");
ensureColumn('users', 'tokens_used_total', "tokens_used_total INTEGER NOT NULL DEFAULT 0");

// --- moderation ---
// blocked_until : epoch ms when a temporary block lifts. NULL = permanent block (if blocked=1)
// or no block at all (if blocked=0).
ensureColumn('users', 'blocked_until', "blocked_until INTEGER");
ensureColumn('users', 'block_reason',  "block_reason TEXT");

// Periodic cleanup of expired codes/sessions
setInterval(() => {
  const now = Date.now();
  db.prepare('DELETE FROM pending_codes WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
}, 60_000);

// Periodic VACUUM — reclaims deleted-row space, optimizes indexes.
// Runs every 24h. Cheap on SQLite (<100ms for typical sizes).
setInterval(() => {
  try { db.exec('VACUUM'); db.exec('ANALYZE'); }
  catch (e) { console.error('[db vacuum]', e.message); }
}, 24 * 60 * 60 * 1000);

/* ============================================================
   audit() — append-only log of privileged actions.
   Usage:
     audit({ actor: 'admin@x.com', action: 'block_user',
             target: 'bob@x.com', detail: { blocked: 1 }, ip: req.ip });
   ============================================================ */
/* ============================================================
   isBlockedNow — single source of truth for "is this user blocked
   right now?". Auto-unblocks temporary blocks whose deadline has
   passed (lazy cleanup, no cron needed).
   Returns: { blocked: boolean, until: epochMs|null }
   ============================================================ */
export function isBlockedNow(email) {
  const e = String(email || '').toLowerCase();
  const u = db.prepare('SELECT blocked, blocked_until FROM users WHERE email = ?').get(e);
  if (!u) return { blocked: false, until: null };
  if (u.blocked !== 1) return { blocked: false, until: null };
  // Temp block expired → auto-unblock
  if (u.blocked_until && Date.now() >= u.blocked_until) {
    db.prepare("UPDATE users SET blocked = 0, blocked_until = NULL, block_reason = NULL, updated_at = datetime('now') WHERE email = ?").run(e);
    return { blocked: false, until: null };
  }
  return { blocked: true, until: u.blocked_until || null };
}

export function audit({ actor, action, target = null, detail = null, ip = null }) {
  try {
    db.prepare(`INSERT INTO audit_log (actor_email, action, target_email, detail, ip)
                VALUES (?, ?, ?, ?, ?)`)
      .run(
        String(actor || 'system').toLowerCase(),
        String(action),
        target ? String(target).toLowerCase() : null,
        detail ? JSON.stringify(detail) : null,
        ip ? String(ip).slice(0, 64) : null
      );
  } catch (e) { console.error('[audit]', e.message); }
}

export default db;
