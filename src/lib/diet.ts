import { randomUUID } from "node:crypto";
import { store } from "./store";
import type { DietPlan, Meal } from "./types";

export function listDietPlans(userId: string): DietPlan[] {
  return (store.dietPlans.get(userId) ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDietPlan(userId: string, date: string): DietPlan | undefined {
  return (store.dietPlans.get(userId) ?? []).find((p) => p.date === date);
}

function totals(meals: Meal[]) {
  return meals.reduce(
    (acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.proteinG;
      return acc;
    },
    { calories: 0, protein: 0 },
  );
}

export function upsertDietPlan(
  userId: string,
  date: string,
  meals: Meal[],
): DietPlan {
  const arr = store.dietPlans.get(userId) ?? [];
  const now = Date.now();
  const t = totals(meals);
  const idx = arr.findIndex((p) => p.date === date);
  const plan: DietPlan = {
    id: idx >= 0 ? arr[idx]!.id : randomUUID(),
    userId,
    date,
    meals,
    totalCalories: t.calories,
    totalProtein: t.protein,
    createdAt: idx >= 0 ? arr[idx]!.createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) arr[idx] = plan;
  else arr.push(plan);
  store.dietPlans.set(userId, arr);
  return plan;
}

export function deleteDietPlan(userId: string, id: string): boolean {
  const arr = store.dietPlans.get(userId) ?? [];
  const next = arr.filter((p) => p.id !== id);
  if (next.length === arr.length) return false;
  store.dietPlans.set(userId, next);
  return true;
}

export function newMeal(): Meal {
  return {
    id: randomUUID(),
    name: "",
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
}
