import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { createExercise, listExercises, MUSCLE_GROUPS } from "@/lib/exercises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ exercises: listExercises(user.id) });
}

const Body = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum(MUSCLE_GROUPS as [string, ...string[]]),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weightKg: z.number().min(0).max(500),
  dayOfWeek: z.number().int().min(1).max(7),
  notes: z.string().max(500).default(""),
  imageId: z.string().nullable().optional(),
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
  const ex = createExercise(user.id, {
    name: parsed.data.name,
    muscleGroup: parsed.data.muscleGroup as never,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
    weightKg: parsed.data.weightKg,
    dayOfWeek: parsed.data.dayOfWeek,
    notes: parsed.data.notes ?? "",
    imageId: parsed.data.imageId ?? null,
  });
  return NextResponse.json({ exercise: ex });
}
