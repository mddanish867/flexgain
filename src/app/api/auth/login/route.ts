import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { findUserByEmail, toPublicUser } from "@/lib/users";
import { verifyPassword } from "@/lib/password";
import { signSession, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
  const token = await signSession({ uid: user.id, email: user.email, name: user.name });
  const cookie = sessionCookieOptions();
  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
