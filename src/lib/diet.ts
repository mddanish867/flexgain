import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { DietPlan, Meal } from "./types";

interface DietRow {
  id: string;
  user_id: string;
  date: string;
  meals: Meal[];
  total_calories: number;
  total_protein: number;
  created_at: string;
  updated_at: string;
}

function fromRow(r: DietRow): DietPlan {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    meals: r.meals,
    totalCalories: Number(r.total_calories),
    totalProtein: Number(r.total_protein),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export async function listDietPlans(userId: string): Promise<DietPlan[]> {
  const rows = await query<DietRow>(
    "SELECT * FROM diet_plans WHERE user_id = $1 ORDER BY date DESC",
    [userId],
  );
  return rows.map(fromRow);
}

export async function getDietPlan(
  userId: string,
  date: string,
): Promise<DietPlan | undefined> {
  const rows = await query<DietRow>(
    "SELECT * FROM diet_plans WHERE user_id = $1 AND date = $2",
    [userId, date],
  );
  return rows[0] ? fromRow(rows[0]) : undefined;
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

export async function upsertDietPlan(
  userId: string,
  date: string,
  meals: Meal[],
): Promise<DietPlan> {
  const now = Date.now();
  const t = totals(meals);
  const rows = await query<DietRow>(
    `INSERT INTO diet_plans
       (id, user_id, date, meals, total_calories, total_protein, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id, date) DO UPDATE
       SET meals = EXCLUDED.meals,
           total_calories = EXCLUDED.total_calories,
           total_protein = EXCLUDED.total_protein,
           updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [randomUUID(), userId, date, JSON.stringify(meals), t.calories, t.protein, now, now],
  );
  return fromRow(rows[0]!);
}

export async function deleteDietPlan(userId: string, id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM diet_plans WHERE user_id = $1 AND id = $2 RETURNING id",
    [userId, id],
  );
  return rows.length > 0;
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
