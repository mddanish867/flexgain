import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { listMuscleLogs, logMuscle, sorenessByGroup } from "@/lib/muscles";
import { MUSCLE_GROUPS } from "@/lib/exercises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? undefined;
  return NextResponse.json({
    logs: listMuscleLogs(user.id, date),
    sorenessByGroup: sorenessByGroup(user.id),
  });
}

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  muscleGroup: z.enum(MUSCLE_GROUPS as [string, ...string[]]),
  soreness: z.number().int().min(1).max(10),
  trained: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const log = logMuscle(user.id, parsed.data as never);
  return NextResponse.json({ log });
}
