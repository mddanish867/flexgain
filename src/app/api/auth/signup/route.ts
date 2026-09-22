import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createUser, findUserByEmail, toPublicUser } from "@/lib/users";
import { signSession, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(100),
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
  const { email, password, name } = parsed.data;

  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const user = await createUser({ email, password, name });
  const token = await signSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    tv: user.tokenVersion,
  });
  const cookie = sessionCookieOptions();
  const res = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
