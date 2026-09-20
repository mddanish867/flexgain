import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findUserById, toPublicUser } from "@/lib/users";
import { ensureSeed } from "@/lib/seed";

export const runtime = "nodejs";

export async function GET() {
  await ensureSeed();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = await findUserById(session.uid);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}
