import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./session";
import { findUserById, toPublicUser } from "./users";
import type { PublicUser, User } from "./types";

/**
 * Resolves the signed-in user record, or null if the request is
 * unauthenticated or its session has been revoked.
 *
 * A valid signature isn't sufficient: the token also has to carry the
 * user's current token version. "Sign out everywhere" bumps that version,
 * which is what makes previously issued tokens stop working before their
 * 14-day expiry.
 */
export async function getCurrentUserRecord(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await findUserById(payload.uid);
  if (!user) return null;
  // Tokens minted before token versioning existed carry no `tv`; treat
  // them as version 0, which is where every existing account starts.
  if ((payload.tv ?? 0) !== user.tokenVersion) return null;
  return user;
}

/**
 * Server-side helper used by API route handlers and server components.
 * Returns null if the request is unauthenticated.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getCurrentUserRecord();
  return user ? toPublicUser(user) : null;
}
