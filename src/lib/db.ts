/**
 * Postgres connection pool + lazy schema bootstrap.
 *
 * Replaces the old in-memory store: on Vercel (and any serverless host)
 * each request can land on a different isolated instance, so data kept
 * in process memory disappears between requests. Postgres gives every
 * instance a shared, durable backing store.
 *
 * Set DATABASE_URL in the environment (see .env.example).
 */
import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __FLEXGAIN_PG_POOL__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __FLEXGAIN_SCHEMA_READY__: Promise<void> | undefined;
}

/**
 * TLS policy for the connection.
 *
 * Verification is ON by default — Neon, Supabase and Vercel Postgres all
 * present certificates chaining to public CAs, so this works out of the
 * box. Providers using a private CA can either point NODE_EXTRA_CA_CERTS
 * at their root, or set DATABASE_SSL_NO_VERIFY=1 to accept any cert
 * (which makes the connection interceptable — use it only on a trusted
 * network). Plain local Postgres opts out entirely via `?sslmode=disable`.
 */
function sslConfig(connectionString: string) {
  // Only `disable` means no TLS at all.
  if (connectionString.includes("sslmode=disable")) {
    return false as const;
  }
  // `no-verify` still encrypts, it just skips certificate checking.
  if (
    connectionString.includes("sslmode=no-verify") ||
    process.env.DATABASE_SSL_NO_VERIFY === "1"
  ) {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres instance.",
    );
  }
  return new Pool({
    connectionString,
    ssl: sslConfig(connectionString),
    // Serverless hosts run many isolated instances, each with its own pool,
    // so the per-instance cap multiplies by the number of warm instances.
    // Keep it small: a request only ever holds one connection at a time.
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    // Release idle connections so scaled-down instances stop occupying
    // slots on the server.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

// Lazy: constructed on first real use, not at module import time, so
// `next build` (which loads route modules to collect page data) doesn't
// require DATABASE_URL to be present.
function getPool(): Pool {
  if (!globalThis.__FLEXGAIN_PG_POOL__) {
    globalThis.__FLEXGAIN_PG_POOL__ = createPool();
  }
  return globalThis.__FLEXGAIN_PG_POOL__;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  weight_goal_kg DOUBLE PRECISION NOT NULL,
  calorie_goal DOUBLE PRECISION NOT NULL,
  protein_goal DOUBLE PRECISION NOT NULL,
  units TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg DOUBLE PRECISION NOT NULL,
  day_of_week INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  image_id TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS exercises_user_id_idx ON exercises(user_id);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight_kg DOUBLE PRECISION,
  calories DOUBLE PRECISION NOT NULL,
  protein_g DOUBLE PRECISION NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at BIGINT NOT NULL,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight_kg DOUBLE PRECISION NOT NULL,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS muscle_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  soreness INTEGER NOT NULL,
  trained BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, date, muscle_group)
);

CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meals JSONB NOT NULL,
  total_calories DOUBLE PRECISION NOT NULL,
  total_protein DOUBLE PRECISION NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  data BYTEA NOT NULL,
  uploaded_at BIGINT NOT NULL
);

-- Failed sign-in attempts, used to rate limit /api/auth/login. Rows are
-- pruned opportunistically once they fall outside the limiter window.
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY,
  bucket TEXT NOT NULL,
  at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_bucket_at_idx
  ON login_attempts(bucket, at);
CREATE INDEX IF NOT EXISTS login_attempts_at_idx ON login_attempts(at);

-- Cached AI answers, keyed by a hash of the request. Exercise lookups
-- repeat constantly ("Bench Press" is the same answer for everyone at the
-- same bodyweight band), and a cache hit costs nothing.
CREATE TABLE IF NOT EXISTS ai_cache (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_cache_created_at_idx ON ai_cache(created_at);

-- Generated training blocks, kept so a plan survives a refresh and the
-- user can come back to it without paying for another generation.
CREATE TABLE IF NOT EXISTS ai_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  focus TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_plans_user_created_idx
  ON ai_plans(user_id, created_at DESC);

-- Migrations for databases created before a column existed. CREATE TABLE
-- IF NOT EXISTS above is a no-op on them, so additive changes go here.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- Weight is optional on a nutrition log: you can record what you ate on a
-- day you didn't step on a scale. Older databases created the column NOT
-- NULL, so drop that constraint and turn the old 0 sentinel into a real
-- NULL so "not weighed" stops rendering as 0 kg.
ALTER TABLE nutrition_logs ALTER COLUMN weight_kg DROP NOT NULL;
UPDATE nutrition_logs SET weight_kg = NULL WHERE weight_kg = 0;
`;

/** Runs once per warm instance; safe to call before every query. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__FLEXGAIN_SCHEMA_READY__) {
    globalThis.__FLEXGAIN_SCHEMA_READY__ = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        // Don't cache a failed bootstrap — the next request should retry
        // rather than inherit a permanently rejected promise.
        globalThis.__FLEXGAIN_SCHEMA_READY__ = undefined;
        throw err;
      });
  }
  return globalThis.__FLEXGAIN_SCHEMA_READY__;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  await ensureSchema();
  const res = await getPool().query<T>(text, params as unknown[]);
  return res.rows;
}

/** Postgres unique_violation error code. */
export const UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === UNIQUE_VIOLATION
  );
}
