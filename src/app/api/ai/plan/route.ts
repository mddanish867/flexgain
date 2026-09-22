import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { latestWeight } from "@/lib/nutrition";
import { callGemini } from "@/lib/ai/gemini";
import { PLAN_SYSTEM, planPrompt } from "@/lib/ai/prompts";
import { Plan, planSchema } from "@/lib/ai/schemas";
import { FOCUS_AREAS } from "@/lib/ai/muscles";
import { cacheKey, cached } from "@/lib/ai/cache";
import { listPlans, savePlan } from "@/lib/ai/plans";
import { aiErrorResponse } from "@/lib/ai/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generating a full week takes ~30s. Vercel's default function timeout is
// well under that, so raise it here rather than letting the request die
// halfway through a billed generation.
export const maxDuration = 60;


const FOCUS_IDS = FOCUS_AREAS.map((f) => f.id) as [string, ...string[]];

const Body = z.object({
  // Generous: people paste a whole existing split here ("Mon: Back and
  // Biceps, Tue: Legs A (Squat, RDL, ...)") and ask for it to be built
  // out, which a short cap rejected outright.
  goalText: z.string().min(3).max(2000),
  focus: z.enum(FOCUS_IDS),
  daysPerWeek: z.number().int().min(1).max(7).default(4),
  experience: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  equipment: z.string().max(200).default("full gym"),
});

/** Returns previously generated plans, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ plans: await listPlans(user.id) });
}

/**
 * Builds a full training block for a goal: a 7-day split with per-exercise
 * muscle targeting, plus the nutrition that supports it.
 */
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
  const input = parsed.data;
  const focusArea = FOCUS_AREAS.find((f) => f.id === input.focus)!;
  const bodyweightKg = (await latestWeight(user.id)) ?? null;
  const weightBucket =
    bodyweightKg === null ? null : Math.round(bodyweightKg / 5) * 5;

  try {
    const { value, hit } = await cached(
      cacheKey("plan", {
        goal: input.goalText.toLowerCase().trim(),
        focus: input.focus,
        days: input.daysPerWeek,
        experience: input.experience,
        equipment: input.equipment.toLowerCase().trim(),
        weightBucket,
        goalWeight: user.settings.weightGoalKg,
      }),
      "plan",
      async () => {
        const raw = await callGemini({
          system: PLAN_SYSTEM,
          prompt: planPrompt({
            goalText: input.goalText,
            focusLabel: focusArea.label,
            daysPerWeek: input.daysPerWeek,
            bodyweightKg,
            goalWeightKg: user.settings.weightGoalKg,
            experience: input.experience,
            equipment: input.equipment,
            calorieGoal: user.settings.calorieGoal,
            proteinGoal: user.settings.proteinGoal,
          }),
          schema: planSchema,
          // A shade more latitude than the factual lookups: exercise
          // selection benefits from variety between regenerations.
          temperature: 0.6,
        });
        return Plan.parse(raw);
      },
    );

    const stored = await savePlan(user.id, input.goalText, input.focus, value);
    return NextResponse.json({ plan: value, id: stored.id, cached: hit });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
