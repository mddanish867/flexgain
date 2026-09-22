import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/currentUser";
import { getPlan } from "@/lib/ai/plans";
import { createExercise, listExercises, deleteExercise } from "@/lib/exercises";
import { upsertDietPlan } from "@/lib/diet";
import { updateUser } from "@/lib/users";
import { groupForMuscles } from "@/lib/ai/muscles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  /** Clear the existing library first, so the week matches the plan exactly. */
  replaceExisting: z.boolean().default(false),
  /** Also adopt the plan's calorie/protein targets and today's meals. */
  applyNutrition: z.boolean().default(true),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Writes a generated plan into the user's real data: one exercise row per
 * movement per training day, and optionally the nutrition that goes with
 * it. Everything lands in the existing tables, so the rest of the app
 * treats it like any hand-entered workout.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    // An empty body is fine — the defaults are the common case.
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const stored = await getPlan(user.id, id);
  if (!stored) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.replaceExisting) {
    const existing = await listExercises(user.id);
    for (const ex of existing) await deleteExercise(user.id, ex.id);
  }

  let created = 0;
  for (const day of stored.plan.days) {
    if (day.isRest) continue;
    for (const ex of day.exercises) {
      const notes = [ex.why, ...(ex.intensity === "extreme" ? ["Extreme effort — go to near failure."] : [])]
        .join(" ")
        .slice(0, 500);
      await createExercise(user.id, {
        name: ex.name.slice(0, 100),
        muscleGroup: groupForMuscles(ex.primaryMuscles),
        sets: ex.sets,
        reps: ex.reps,
        weightKg: ex.suggestedWeightKg,
        dayOfWeek: day.dayOfWeek,
        notes,
        imageId: null,
      });
      created++;
    }
  }

  let nutritionApplied = false;
  if (parsed.data.applyNutrition) {
    const date = parsed.data.date ?? new Date().toISOString().slice(0, 10);
    await updateUser(user.id, {
      settings: {
        ...user.settings,
        calorieGoal: stored.plan.nutrition.calories,
        proteinGoal: stored.plan.nutrition.proteinG,
      },
    });
    await upsertDietPlan(
      user.id,
      date,
      stored.plan.nutrition.meals.map((m) => ({
        id: randomUUID(),
        name: m.name,
        calories: m.calories,
        proteinG: m.proteinG,
        carbsG: m.carbsG,
        fatG: m.fatG,
        time: m.time,
      })),
    );
    nutritionApplied = true;
  }

  return NextResponse.json({ ok: true, exercisesCreated: created, nutritionApplied });
}
