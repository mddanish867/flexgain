/**
 * Rate limiting for sign-in attempts.
 *
 * Backed by Postgres rather than process memory: each serverless instance
 * has its own memory, so an in-process counter caps attempts per instance
 * instead of per attacker. The `login_attempts` table is shared, so the
 * limit holds however many instances are warm.
 */
import { randomUUID } from "node:crypto";
import { query } from "./db";

/** How far back attempts are counted. */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Per-address caps. The IP limit is the one that actually stops a brute
 * force; the per-email limit is deliberately looser so an attacker can't
 * cheaply lock a real user out of their own account by failing logins
 * against their address.
 */
export const LOGIN_MAX_PER_IP = 20;
export const LOGIN_MAX_PER_EMAIL = 10;

export interface RateLimitVerdict {
  allowed: boolean;
  /** Seconds until the oldest attempt in the exceeded bucket ages out. */
  retryAfterSeconds: number;
}

interface CountRow {
  bucket: string;
  count: string;
  oldest: string;
}

/**
 * Returns whether any of the given buckets is over its limit inside the
 * window. Buckets are checked together in one round trip.
 */
export async function checkLoginBuckets(
  buckets: Array<{ key: string; limit: number }>,
  windowMs: number = LOGIN_WINDOW_MS,
): Promise<RateLimitVerdict> {
  const now = Date.now();
  const since = now - windowMs;
  const rows = await query<CountRow>(
    `SELECT bucket, COUNT(*) AS count, MIN(at) AS oldest
       FROM login_attempts
      WHERE bucket = ANY($1::text[]) AND at >= $2
      GROUP BY bucket`,
    [buckets.map((b) => b.key), since],
  );

  let retryAfterSeconds = 0;
  for (const bucket of buckets) {
    const row = rows.find((r) => r.bucket === bucket.key);
    if (!row) continue;
    if (Number(row.count) < bucket.limit) continue;
    const freeAt = Number(row.oldest) + windowMs;
    retryAfterSeconds = Math.max(
      retryAfterSeconds,
      Math.ceil((freeAt - now) / 1000),
    );
  }

  return {
    allowed: retryAfterSeconds <= 0,
    retryAfterSeconds: Math.max(retryAfterSeconds, 0),
  };
}

/** Records one failed attempt against each bucket and prunes stale rows. */
export async function recordLoginFailure(
  keys: string[],
  windowMs: number = LOGIN_WINDOW_MS,
): Promise<void> {
  const now = Date.now();
  await query(
    `INSERT INTO login_attempts (id, bucket, at)
     SELECT unnest($1::uuid[]), unnest($2::text[]), $3`,
    [keys.map(() => randomUUID()), keys, now],
  );

  // Keep the buckets we just touched bounded. This uses the
  // (bucket, at) index, so it stays cheap even under a sustained attack.
  await query(
    `DELETE FROM login_attempts WHERE bucket = ANY($1::text[]) AND at < $2`,
    [keys, now - windowMs],
  );

  // Buckets that go quiet still leave up to `limit` rows behind, so sweep
  // the whole table occasionally to stop it growing without bound.
  if (Math.random() < 0.02) {
    await query(`DELETE FROM login_attempts WHERE at < $1`, [now - windowMs]);
  }
}

/** Clears a successful signer's buckets so one good login resets the count. */
export async function clearLoginAttempts(keys: string[]): Promise<void> {
  await query(`DELETE FROM login_attempts WHERE bucket = ANY($1::text[])`, [
    keys,
  ]);
}

/**
 * Best-effort client address. Vercel and most proxies set x-forwarded-for;
 * the left-most entry is the original client. Requests with no usable
 * header share one bucket, which is the conservative choice.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
