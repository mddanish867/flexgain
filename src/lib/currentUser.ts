import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./session";
import { findUserById, toPublicUser } from "./users";
import type { PublicUser } from "./types";

/**
 * Server-side helper used by API route handlers and server components.
 * Returns null if the request is unauthenticated.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await findUserById(payload.uid);
  if (!user) return null;
  return toPublicUser(user);
}
