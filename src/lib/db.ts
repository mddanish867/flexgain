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

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres instance.",
    );
  }
  return new Pool({
    connectionString,
    // Hosted providers (Neon, Supabase, Vercel Postgres) terminate TLS with
    // certs outside Node's default trust store; skip verification for those.
    // Local/self-hosted Postgres can opt out via `?sslmode=disable`.
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
    max: 5,
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
  units TEXT NOT NULL
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
  weight_kg DOUBLE PRECISION NOT NULL,
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
`;

/** Runs once per warm instance; safe to call before every query. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__FLEXGAIN_SCHEMA_READY__) {
    globalThis.__FLEXGAIN_SCHEMA_READY__ = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined);
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
