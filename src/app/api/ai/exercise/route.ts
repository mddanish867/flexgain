import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { latestWeight } from "@/lib/nutrition";
import { callGemini } from "@/lib/ai/gemini";
import { EXERCISE_SYSTEM, exercisePrompt } from "@/lib/ai/prompts";
import { ExerciseFill, exerciseFillSchema } from "@/lib/ai/schemas";
import { groupForMuscles } from "@/lib/ai/muscles";
import { cacheKey, cached } from "@/lib/ai/cache";
import { aiErrorResponse } from "@/lib/ai/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generating a full week takes ~30s. Vercel's default function timeout is
// well under that, so raise it here rather than letting the request die
// halfway through a billed generation.
export const maxDuration = 60;


const Body = z.object({
  name: z.string().min(2).max(100),
  experience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

/**
 * Auto-fills an exercise from its name: description, the muscles it
 * trains, and a starting set/rep/weight prescription.
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

  const name = parsed.data.name.trim();
  const bodyweightKg = (await latestWeight(user.id)) ?? null;
  // Bucket bodyweight to the nearest 5 kg for the cache key: the advice
  // doesn't change between 74.2 kg and 74.8 kg, but an exact key would
  // miss every single time.
  const weightBucket =
    bodyweightKg === null ? null : Math.round(bodyweightKg / 5) * 5;

  try {
    const { value, hit } = await cached(
      cacheKey("exercise", {
        name: name.toLowerCase(),
        weightBucket,
        experience: parsed.data.experience ?? "intermediate",
      }),
      "exercise",
      async () => {
        const raw = await callGemini({
          system: EXERCISE_SYSTEM,
          prompt: exercisePrompt({
            name,
            bodyweightKg,
            units: user.settings.units,
            experience: parsed.data.experience,
          }),
          schema: exerciseFillSchema,
          temperature: 0.2,
        });
        return ExerciseFill.parse(raw);
      },
    );

    return NextResponse.json({
      fill: value,
      // Map onto the coarse group the exercises table stores, so the
      // client can save the result without another decision.
      muscleGroup: groupForMuscles(value.primaryMuscles),
      cached: hit,
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
