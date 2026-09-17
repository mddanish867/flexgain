import { randomUUID } from "node:crypto";
import { store } from "./store";
import type { MuscleGroup, MuscleLog } from "./types";

export function listMuscleLogs(userId: string, date?: string): MuscleLog[] {
  const all = store.muscleLogs.get(userId) ?? [];
  return date ? all.filter((m) => m.date === date) : all;
}

export function logMuscle(
  userId: string,
  input: Omit<MuscleLog, "id" | "userId">,
): MuscleLog {
  const arr = store.muscleLogs.get(userId) ?? [];
  const idx = arr.findIndex(
    (m) => m.date === input.date && m.muscleGroup === input.muscleGroup,
  );
  const log: MuscleLog = {
    id: idx >= 0 ? arr[idx].id : randomUUID(),
    userId,
    ...input,
  };
  if (idx >= 0) arr[idx] = log;
  else arr.push(log);
  store.muscleLogs.set(userId, arr);
  return log;
}

/** Average soreness per muscle group over last N days */
export function sorenessByGroup(
  userId: string,
  sinceDays = 7,
): Record<MuscleGroup, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const all = (store.muscleLogs.get(userId) ?? []).filter(
    (m) => m.date >= cutoffStr,
  );
  const result: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    legs: 0,
    shoulders: 0,
    arms: 0,
    core: 0,
    full_body: 0,
  };
  for (const log of all) {
    result[log.muscleGroup] = Math.max(result[log.muscleGroup], log.soreness);
  }
  return result;
}
