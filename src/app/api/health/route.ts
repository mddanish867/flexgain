import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const [users] = await query<{ count: string }>("SELECT COUNT(*) FROM users");
  const [exercises] = await query<{ count: string }>(
    "SELECT COUNT(*) FROM exercises",
  );
  return NextResponse.json({
    ok: true,
    users: Number(users?.count ?? 0),
    exercises: Number(exercises?.count ?? 0),
    timestamp: Date.now(),
  });
}
