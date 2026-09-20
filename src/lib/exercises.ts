import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { Exercise, MuscleGroup } from "./types";

export type ExerciseInput = Omit<
  Exercise,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

interface ExerciseRow {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup;
  sets: number;
  reps: number;
  weight_kg: number;
  day_of_week: number;
  notes: string;
  image_id: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(r: ExerciseRow): Exercise {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    muscleGroup: r.muscle_group,
    sets: Number(r.sets),
    reps: Number(r.reps),
    weightKg: Number(r.weight_kg),
    dayOfWeek: Number(r.day_of_week),
    notes: r.notes,
    imageId: r.image_id,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export async function listExercises(userId: string): Promise<Exercise[]> {
  const rows = await query<ExerciseRow>(
    "SELECT * FROM exercises WHERE user_id = $1 ORDER BY created_at ASC",
    [userId],
  );
  return rows.map(fromRow);
}

export async function getExercise(
  userId: string,
  id: string,
): Promise<Exercise | undefined> {
  const rows = await query<ExerciseRow>(
    "SELECT * FROM exercises WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function createExercise(
  userId: string,
  input: ExerciseInput,
): Promise<Exercise> {
  const now = Date.now();
  const rows = await query<ExerciseRow>(
    `INSERT INTO exercises
       (id, user_id, name, muscle_group, sets, reps, weight_kg, day_of_week,
        notes, image_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      randomUUID(),
      userId,
      input.name,
      input.muscleGroup,
      input.sets,
      input.reps,
      input.weightKg,
      input.dayOfWeek,
      input.notes,
      input.imageId,
      now,
      now,
    ],
  );
  return fromRow(rows[0]!);
}

export async function updateExercise(
  userId: string,
  id: string,
  patch: Partial<ExerciseInput>,
): Promise<Exercise | undefined> {
  const existing = await getExercise(userId, id);
  if (!existing) return undefined;
  const next: ExerciseInput = { ...existing, ...patch };
  const rows = await query<ExerciseRow>(
    `UPDATE exercises
        SET name = $3, muscle_group = $4, sets = $5, reps = $6,
            weight_kg = $7, day_of_week = $8, notes = $9, image_id = $10,
            updated_at = $11
      WHERE user_id = $1 AND id = $2
      RETURNING *`,
    [
      userId,
      id,
      next.name,
      next.muscleGroup,
      next.sets,
      next.reps,
      next.weightKg,
      next.dayOfWeek,
      next.notes,
      next.imageId,
      Date.now(),
    ],
  );
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function deleteExercise(
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await query(
    "DELETE FROM exercises WHERE user_id = $1 AND id = $2 RETURNING id",
    [userId, id],
  );
  return rows.length > 0;
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
