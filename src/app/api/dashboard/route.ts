import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { listExercises } from "@/lib/exercises";
import {
  listNutrition,
  listWeights,
  todayLog,
  latestWeight,
} from "@/lib/nutrition";
import { sorenessByGroup } from "@/lib/muscles";
import { getDietPlan } from "@/lib/diet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayStr();
  return NextResponse.json({
    today,
    settings: user.settings,
    exercises: listExercises(user.id),
    nutrition: {
      today: todayLog(user.id, today) ?? null,
      history: listNutrition(user.id).slice(0, 30),
    },
    weights: listWeights(user.id).slice(-90),
    sorenessByGroup: sorenessByGroup(user.id),
    diet: getDietPlan(user.id, today) ?? null,
    currentWeight: latestWeight(user.id) ?? null,
  });
}
