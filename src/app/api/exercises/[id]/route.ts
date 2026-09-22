import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import {
  deleteExercise,
  getExercise,
  updateExercise,
  MUSCLE_GROUPS,
} from "@/lib/exercises";
import { deleteImage } from "@/lib/imageStore";

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

  const existing = await getExercise(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ex = await updateExercise(user.id, id, parsed.data as never);
  if (!ex) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The old upload is unreachable once nothing points at it, so drop it
  // rather than leave a row nothing will ever read.
  if (
    parsed.data.imageId !== undefined &&
    existing.imageId &&
    existing.imageId !== ex.imageId
  ) {
    await deleteImage(existing.imageId, user.id).catch(() => undefined);
  }

  return NextResponse.json({ exercise: ex });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  // Read the image id before the row goes away, so deleting an exercise
  // takes its upload with it in one request instead of relying on the
  // client to follow up with a second call it might never make.
  const existing = await getExercise(user.id, id);
  const ok = await deleteExercise(user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing?.imageId) {
    await deleteImage(existing.imageId, user.id).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
