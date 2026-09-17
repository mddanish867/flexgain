import { randomUUID } from "node:crypto";
import { store } from "./store";
import type { NutritionLog, WeightEntry } from "./types";

export type NutritionInput = Omit<NutritionLog, "id" | "userId" | "createdAt">;

export function listNutrition(
  userId: string,
  opts?: { from?: string; to?: string },
): NutritionLog[] {
  const all = store.nutritionLogs.get(userId) ?? [];
  return all
    .filter((n) => {
      if (opts?.from && n.date < opts.from) return false;
      if (opts?.to && n.date > opts.to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function todayLog(userId: string, date: string): NutritionLog | undefined {
  return (store.nutritionLogs.get(userId) ?? []).find((n) => n.date === date);
}

export function logNutrition(
  userId: string,
  input: NutritionInput,
): NutritionLog {
  const arr = store.nutritionLogs.get(userId) ?? [];
  // Replace existing entry for same date if present
  const existingIdx = arr.findIndex((n) => n.date === input.date);
  const log: NutritionLog = {
    id: existingIdx >= 0 ? arr[existingIdx].id : randomUUID(),
    userId,
    ...input,
    createdAt:
      existingIdx >= 0 ? arr[existingIdx].createdAt : Date.now(),
  };
  if (existingIdx >= 0) arr[existingIdx] = log;
  else arr.push(log);
  store.nutritionLogs.set(userId, arr);

  // Also push a weight entry when the log has a weight value
  if (input.weightKg > 0) {
    logWeight(userId, { date: input.date, weightKg: input.weightKg });
  }

  return log;
}

export function deleteNutrition(userId: string, id: string): boolean {
  const arr = store.nutritionLogs.get(userId) ?? [];
  const next = arr.filter((n) => n.id !== id);
  if (next.length === arr.length) return false;
  store.nutritionLogs.set(userId, next);
  return true;
}

// Weight history — simple append
export function listWeights(userId: string): WeightEntry[] {
  return (store.weightEntries.get(userId) ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function logWeight(userId: string, input: Omit<WeightEntry, "id" | "userId">) {
  const arr = store.weightEntries.get(userId) ?? [];
  // Upsert by date — only one entry per date
  const idx = arr.findIndex((w) => w.date === input.date);
  const entry: WeightEntry = {
    id: idx >= 0 ? arr[idx].id : randomUUID(),
    userId,
    date: input.date,
    weightKg: input.weightKg,
  };
  if (idx >= 0) arr[idx] = entry;
  else arr.push(entry);
  store.weightEntries.set(userId, arr);
  return entry;
}

export function latestWeight(userId: string): number | undefined {
  const list = listWeights(userId);
  return list.length ? list[list.length - 1]!.weightKg : undefined;
}
