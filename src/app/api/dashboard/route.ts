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
  const [exercises, todayNutrition, nutritionHistory, weights, soreness, diet, currentWeight] =
    await Promise.all([
      listExercises(user.id),
      todayLog(user.id, today),
      listNutrition(user.id),
      listWeights(user.id),
      sorenessByGroup(user.id),
      getDietPlan(user.id, today),
      latestWeight(user.id),
    ]);
  return NextResponse.json({
    today,
    settings: user.settings,
    exercises,
    nutrition: {
      today: todayNutrition ?? null,
      history: nutritionHistory.slice(0, 30),
    },
    weights: weights.slice(-90),
    sorenessByGroup: soreness,
    diet: diet ?? null,
    currentWeight: currentWeight ?? null,
  });
}
