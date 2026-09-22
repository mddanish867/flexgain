/**
 * Cache for AI answers.
 *
 * Generated answers are deterministic enough to reuse: "Barbell Bench
 * Press" for a 75 kg lifter is the same answer today and tomorrow. Caching
 * on a hash of the request means a repeat lookup is a single indexed read
 * instead of a billed model call, which matters because the exercise
 * auto-fill fires on nearly every exercise a user adds.
 */
import { createHash } from "node:crypto";
import { query } from "../db";

/** Answers older than this are regenerated, so prompt tweaks take effect. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Bump whenever a prompt, schema or post-processing rule changes.
 *
 * Entries hold the answer *after* validation and normalisation, so a fix
 * to either would otherwise never reach anything already cached — the
 * stale value would keep being served for the full TTL. Making the
 * version part of every key retires the old entries instead.
 */
const CACHE_VERSION = "v2";

export function cacheKey(kind: string, parts: unknown): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 32);
  return `${kind}:${CACHE_VERSION}:${hash}`;
}

export async function readCache<T>(key: string): Promise<T | null> {
  const rows = await query<{ payload: T; created_at: string }>(
    "SELECT payload, created_at FROM ai_cache WHERE key = $1",
    [key],
  );
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - Number(row.created_at) > TTL_MS) return null;
  return row.payload;
}

export async function writeCache(
  key: string,
  kind: string,
  payload: unknown,
): Promise<void> {
  await query(
    `INSERT INTO ai_cache (key, kind, payload, created_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (key) DO UPDATE
       SET payload = EXCLUDED.payload, created_at = EXCLUDED.created_at`,
    [key, kind, JSON.stringify(payload), Date.now()],
  );
}

/**
 * Returns the cached answer, or generates, stores and returns a fresh one.
 * A write failure is swallowed: a cache that can't persist should slow the
 * next request down, not fail this one.
 */
export async function cached<T>(
  key: string,
  kind: string,
  generate: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  const existing = await readCache<T>(key);
  if (existing !== null) return { value: existing, hit: true };
  const value = await generate();
  await writeCache(key, kind, value).catch(() => undefined);
  return { value, hit: false };
}
