import { randomUUID } from "node:crypto";
import { store } from "./store";
import type { Exercise, MuscleGroup } from "./types";

export type ExerciseInput = Omit<
  Exercise,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export function listExercises(userId: string): Exercise[] {
  return store.exercises.get(userId) ?? [];
}

export function getExercise(userId: string, id: string): Exercise | undefined {
  return listExercises(userId).find((e) => e.id === id);
}

export function createExercise(
  userId: string,
  input: ExerciseInput,
): Exercise {
  const now = Date.now();
  const ex: Exercise = {
    id: randomUUID(),
    userId,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const arr = store.exercises.get(userId) ?? [];
  arr.push(ex);
  store.exercises.set(userId, arr);
  return ex;
}

export function updateExercise(
  userId: string,
  id: string,
  patch: Partial<ExerciseInput>,
): Exercise | undefined {
  const arr = store.exercises.get(userId) ?? [];
  const idx = arr.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  const next: Exercise = {
    ...arr[idx],
    ...patch,
    updatedAt: Date.now(),
  };
  arr[idx] = next;
  store.exercises.set(userId, arr);
  return next;
}

export function deleteExercise(userId: string, id: string): boolean {
  const arr = store.exercises.get(userId) ?? [];
  const next = arr.filter((e) => e.id !== id);
  if (next.length === arr.length) return false;
  store.exercises.set(userId, next);
  return true;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
];

export function dayName(d: number): string {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d - 1] ?? "";
}
