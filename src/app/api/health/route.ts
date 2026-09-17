import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    users: store.users.size,
    exercises: Array.from(store.exercises.values()).reduce(
      (n, a) => n + a.length,
      0,
    ),
    timestamp: Date.now(),
  });
}
