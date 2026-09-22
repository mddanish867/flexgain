import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { NutritionLog, WeightEntry } from "./types";

export type NutritionInput = Omit<NutritionLog, "id" | "userId" | "createdAt">;

interface NutritionRow {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  calories: number;
  protein_g: number;
  notes: string;
  created_at: string;
}

function fromRow(r: NutritionRow): NutritionLog {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    weightKg: r.weight_kg === null ? null : Number(r.weight_kg),
    calories: Number(r.calories),
    proteinG: Number(r.protein_g),
    notes: r.notes,
    createdAt: Number(r.created_at),
  };
}

export async function listNutrition(
  userId: string,
  opts?: { from?: string; to?: string },
): Promise<NutritionLog[]> {
  const conditions = ["user_id = $1"];
  const params: unknown[] = [userId];
  if (opts?.from) {
    params.push(opts.from);
    conditions.push(`date >= $${params.length}`);
  }
  if (opts?.to) {
    params.push(opts.to);
    conditions.push(`date <= $${params.length}`);
  }
  const rows = await query<NutritionRow>(
    `SELECT * FROM nutrition_logs WHERE ${conditions.join(" AND ")} ORDER BY date DESC`,
    params,
  );
  return rows.map(fromRow);
}

export async function todayLog(
  userId: string,
  date: string,
): Promise<NutritionLog | undefined> {
  const rows = await query<NutritionRow>(
    "SELECT * FROM nutrition_logs WHERE user_id = $1 AND date = $2",
    [userId, date],
  );
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function logNutrition(
  userId: string,
  input: NutritionInput,
): Promise<NutritionLog> {
  const rows = await query<NutritionRow>(
    `INSERT INTO nutrition_logs
       (id, user_id, date, weight_kg, calories, protein_g, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id, date) DO UPDATE
       SET weight_kg = EXCLUDED.weight_kg,
           calories = EXCLUDED.calories,
           protein_g = EXCLUDED.protein_g,
           notes = EXCLUDED.notes
     RETURNING *`,
    [
      randomUUID(),
      userId,
      input.date,
      input.weightKg,
      input.calories,
      input.proteinG,
      input.notes,
      Date.now(),
    ],
  );
  const log = fromRow(rows[0]!);

  // Mirror into the weight history only when a weight was actually
  // recorded — a day logged without one must not land on the chart.
  if (input.weightKg !== null && input.weightKg > 0) {
    await logWeight(userId, { date: input.date, weightKg: input.weightKg });
  }

  return log;
}

export async function deleteNutrition(userId: string, id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM nutrition_logs WHERE user_id = $1 AND id = $2 RETURNING id",
    [userId, id],
  );
  return rows.length > 0;
}

interface WeightRow {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
}

function weightFromRow(r: WeightRow): WeightEntry {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    weightKg: Number(r.weight_kg),
  };
}

// Weight history — simple append (upsert by date)
export async function listWeights(userId: string): Promise<WeightEntry[]> {
  const rows = await query<WeightRow>(
    "SELECT * FROM weight_entries WHERE user_id = $1 ORDER BY date ASC",
    [userId],
  );
  return rows.map(weightFromRow);
}

export async function logWeight(
  userId: string,
  input: Omit<WeightEntry, "id" | "userId">,
): Promise<WeightEntry> {
  const rows = await query<WeightRow>(
    `INSERT INTO weight_entries (id, user_id, date, weight_kg)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg
     RETURNING *`,
    [randomUUID(), userId, input.date, input.weightKg],
  );
  return weightFromRow(rows[0]!);
}

export async function latestWeight(userId: string): Promise<number | undefined> {
  const list = await listWeights(userId);
  return list.length ? list[list.length - 1]!.weightKg : undefined;
}
