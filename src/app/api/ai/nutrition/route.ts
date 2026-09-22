import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { latestWeight } from "@/lib/nutrition";
import { upsertDietPlan } from "@/lib/diet";
import { updateUser } from "@/lib/users";
import { callGemini } from "@/lib/ai/gemini";
import { NUTRITION_SYSTEM, nutritionPrompt } from "@/lib/ai/prompts";
import { NutritionTarget, nutritionTargetSchema } from "@/lib/ai/schemas";
import { cacheKey, cached } from "@/lib/ai/cache";
import { aiErrorResponse } from "@/lib/ai/respond";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generating a full week takes ~30s. Vercel's default function timeout is
// well under that, so raise it here rather than letting the request die
// halfway through a billed generation.
export const maxDuration = 60;


const Body = z.object({
  // Generous: people paste a whole existing split here ("Mon: Back and
  // Biceps, Tue: Legs A (Squat, RDL, ...)") and ask for it to be built
  // out, which a short cap rejected outright.
  goalText: z.string().min(3).max(2000),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  /** Write the result straight into today's goals and diet plan. */
  apply: z.boolean().default(false),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Generates daily calorie/protein targets and a day of meals for a goal. */
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

  const bodyweightKg = (await latestWeight(user.id)) ?? null;
  const weightBucket =
    bodyweightKg === null ? null : Math.round(bodyweightKg / 2) * 2;

  try {
    const { value, hit } = await cached(
      cacheKey("nutrition", {
        goal: parsed.data.goalText.toLowerCase().trim(),
        weightBucket,
        goalWeight: user.settings.weightGoalKg,
        days: parsed.data.trainingDaysPerWeek ?? null,
      }),
      "nutrition",
      async () => {
        const raw = await callGemini({
          system: NUTRITION_SYSTEM,
          prompt: nutritionPrompt({
            goalText: parsed.data.goalText,
            bodyweightKg,
            goalWeightKg: user.settings.weightGoalKg,
            currentCalorieGoal: user.settings.calorieGoal,
            currentProteinGoal: user.settings.proteinGoal,
            trainingDaysPerWeek: parsed.data.trainingDaysPerWeek,
          }),
          schema: nutritionTargetSchema,
          temperature: 0.3,
        });
        return NutritionTarget.parse(raw);
      },
    );

    let applied = false;
    if (parsed.data.apply) {
      const date = parsed.data.date ?? new Date().toISOString().slice(0, 10);
      await updateUser(user.id, {
        settings: {
          ...user.settings,
          calorieGoal: value.calories,
          proteinGoal: value.proteinG,
        },
      });
      await upsertDietPlan(
        user.id,
        date,
        value.meals.map((m) => ({
          id: randomUUID(),
          name: m.name,
          calories: m.calories,
          proteinG: m.proteinG,
          carbsG: m.carbsG,
          fatG: m.fatG,
          time: m.time,
        })),
      );
      applied = true;
    }

    return NextResponse.json({ nutrition: value, cached: hit, applied });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
