/**
 * Session helpers — HMAC-signed JWT stored in an HTTP-only cookie.
 *
 * The cookie is named `flexgain_session`, set httpOnly + sameSite=lax,
 * signed with HS256 using SESSION_SECRET from the environment.
 *
 * jose is edge-runtime compatible, so this works in middleware AND in
 * route handlers.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "./types";

export const COOKIE_NAME = "flexgain_session";
const ALG = "HS256";
const TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    // We do not want to crash a fresh dev checkout, so fall back to a
    // fixed dev secret. Production MUST set SESSION_SECRET.
    return new TextEncoder().encode(
      "dev-secret-do-not-use-in-production-please",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Read the session from the current request's cookies (server components & route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  };
}
