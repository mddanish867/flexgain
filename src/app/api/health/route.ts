import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe. Unauthenticated by design so uptime monitors can hit it,
 * so it reports only whether the database answers — never row counts or
 * any other business data.
 */
export async function GET() {
  try {
    await query("SELECT 1");
  } catch {
    return NextResponse.json(
      { ok: false, database: "unreachable", timestamp: Date.now() },
      { status: 503 },
    );
  }
  return NextResponse.json({
    ok: true,
    database: "ok",
    timestamp: Date.now(),
  });
}
