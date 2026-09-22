import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { isAiConfigured } from "@/lib/ai/gemini";
import { FOCUS_AREAS } from "@/lib/ai/muscles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lets the UI know whether to show the AI controls at all, so an install
 * without a key renders a clean app rather than buttons that always fail.
 * Reports only whether a key is present — never the key itself.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    enabled: isAiConfigured(),
    focusAreas: FOCUS_AREAS.map((f) => ({ id: f.id, label: f.label })),
  });
}
