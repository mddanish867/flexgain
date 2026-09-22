import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { findUserByEmail, toPublicUser } from "@/lib/users";
import { burnPasswordVerification, verifyPassword } from "@/lib/password";
import { signSession, sessionCookieOptions } from "@/lib/session";
import {
  LOGIN_MAX_PER_EMAIL,
  LOGIN_MAX_PER_IP,
  checkLoginBuckets,
  clearLoginAttempts,
  clientIp,
  recordLoginFailure,
} from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function tooManyAttempts(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many sign-in attempts. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const ipBucket = { key: `ip:${clientIp(req)}`, limit: LOGIN_MAX_PER_IP };
  const emailBucket = {
    key: `email:${email.toLowerCase()}`,
    limit: LOGIN_MAX_PER_EMAIL,
  };
  const bucketKeys = [ipBucket.key, emailBucket.key];

  // The IP limit is enforced BEFORE any hashing, so a flood from one
  // source is rejected without spending ~100k PBKDF2 iterations on it.
  const ipVerdict = await checkLoginBuckets([ipBucket]);
  if (!ipVerdict.allowed) return tooManyAttempts(ipVerdict.retryAfterSeconds);

  const user = await findUserByEmail(email);
  // Spend the same time hashing whether or not the account exists, so the
  // response clock doesn't reveal which addresses are registered.
  const ok = user
    ? await verifyPassword(password, user.passwordSalt, user.passwordHash)
    : await burnPasswordVerification(password).then(() => false);

  if (ok && user) {
    // Deliberately checked only on failure: someone presenting the right
    // password is the account owner, and must never be locked out of
    // their own account by an attacker failing logins against their
    // address. The IP limit above is what caps brute-force volume.
    await clearLoginAttempts(bucketKeys);
    const token = await signSession({
      uid: user.id,
      email: user.email,
      name: user.name,
      tv: user.tokenVersion,
    });
    const cookie = sessionCookieOptions();
    const res = NextResponse.json({ user: toPublicUser(user) });
    res.cookies.set(cookie.name, token, cookie);
    return res;
  }

  await recordLoginFailure(bucketKeys);

  // Sustained wrong guesses against one address get throttled too, which
  // slows a brute force spread across many IPs.
  const emailVerdict = await checkLoginBuckets([emailBucket]);
  if (!emailVerdict.allowed) {
    return tooManyAttempts(emailVerdict.retryAfterSeconds);
  }

  return NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 },
  );
}
