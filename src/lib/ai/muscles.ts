/**
 * Canonical muscle vocabulary.
 *
 * This is the contract between three things that must agree exactly:
 *  - the anatomy SVG, which has a shape per id
 *  - the model, which is told to answer using only these ids
 *  - the coarse `MuscleGroup` the exercises table already stores
 *
 * Keeping it in one place is what lets a generated answer light up the
 * right shape instead of silently matching nothing.
 */
import type { MuscleGroup } from "../types";

export const MUSCLE_IDS = [
  "chest",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "lats",
  "traps",
  "lower_back",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "adductors",
  "neck",
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  chest: "Chest",
  front_delts: "Front delts",
  side_delts: "Side delts",
  rear_delts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  lats: "Lats",
  traps: "Traps",
  lower_back: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  adductors: "Adductors",
  neck: "Neck",
};

/** Which view of the body each muscle is drawn on. */
export const MUSCLE_VIEW: Record<MuscleId, "front" | "back" | "both"> = {
  chest: "front",
  front_delts: "front",
  side_delts: "both",
  rear_delts: "back",
  biceps: "front",
  triceps: "back",
  forearms: "both",
  abs: "front",
  obliques: "front",
  lats: "back",
  traps: "both",
  lower_back: "back",
  glutes: "back",
  quads: "front",
  hamstrings: "back",
  calves: "both",
  adductors: "front",
  neck: "both",
};

/**
 * Collapses a fine-grained muscle onto the coarse group the exercises
 * table stores, so an AI-filled exercise still saves against the existing
 * schema and shows up in the existing filters.
 */
export const MUSCLE_TO_GROUP: Record<MuscleId, MuscleGroup> = {
  chest: "chest",
  front_delts: "shoulders",
  side_delts: "shoulders",
  rear_delts: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  lats: "back",
  traps: "back",
  lower_back: "back",
  glutes: "legs",
  quads: "legs",
  hamstrings: "legs",
  calves: "legs",
  adductors: "legs",
  neck: "full_body",
};

export function isMuscleId(v: unknown): v is MuscleId {
  return typeof v === "string" && (MUSCLE_IDS as readonly string[]).includes(v);
}

/**
 * Picks the coarse group for an exercise from its primary muscles, by
 * majority. Ties fall to the first listed, which the prompt asks the model
 * to order by importance.
 */
export function groupForMuscles(primary: MuscleId[]): MuscleGroup {
  if (primary.length === 0) return "full_body";
  const tally = new Map<MuscleGroup, number>();
  for (const m of primary) {
    const g = MUSCLE_TO_GROUP[m];
    tally.set(g, (tally.get(g) ?? 0) + 1);
  }
  let best = MUSCLE_TO_GROUP[primary[0]!];
  let bestN = 0;
  tally.forEach((n, g) => {
    if (n > bestN) {
      best = g;
      bestN = n;
    }
  });
  return best;
}

/** Goal areas the plan generator understands, for the UI's picker. */
export const FOCUS_AREAS = [
  { id: "biceps", label: "Biceps", muscles: ["biceps", "forearms"] },
  { id: "triceps", label: "Triceps", muscles: ["triceps"] },
  { id: "chest", label: "Chest", muscles: ["chest", "front_delts"] },
  { id: "back", label: "Back", muscles: ["lats", "traps", "rhomboids"] },
  { id: "shoulders", label: "Shoulders", muscles: ["front_delts", "side_delts", "rear_delts"] },
  { id: "abs", label: "Abs / core", muscles: ["abs", "obliques"] },
  { id: "legs", label: "Legs", muscles: ["quads", "hamstrings", "glutes", "calves"] },
  { id: "forearms", label: "Forearms", muscles: ["forearms"] },
  { id: "glutes", label: "Glutes", muscles: ["glutes", "hamstrings"] },
  { id: "full_body", label: "Full body", muscles: [] },
] as const;

export type FocusAreaId = (typeof FOCUS_AREAS)[number]["id"];
