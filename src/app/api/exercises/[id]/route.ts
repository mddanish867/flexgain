import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { deleteExercise, updateExercise, MUSCLE_GROUPS } from "@/lib/exercises";

export const runtime = "nodejs";

const PatchBody = z.object({
  name: z.string().min(1).max(100).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS as [string, ...string[]]).optional(),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.number().int().min(1).max(100).optional(),
  weightKg: z.number().min(0).max(500).optional(),
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  notes: z.string().max(500).optional(),
  imageId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const ex = updateExercise(user.id, id, parsed.data as never);
  if (!ex) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ exercise: ex });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = deleteExercise(user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
