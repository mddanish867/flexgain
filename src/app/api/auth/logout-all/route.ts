import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { bumpTokenVersion } from "@/lib/users";
import { COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signs the user out on every device.
 *
 * Session JWTs are stateless, so there's no per-token record to delete.
 * Bumping the user's token version instead changes what the server will
 * accept: every token issued before this call now fails the check in
 * `getCurrentUserRecord`, including ones held by other browsers.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await bumpTokenVersion(user.id);

  // Also clear this device's cookie so the caller doesn't sit on a token
  // that is now guaranteed to be rejected.
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
