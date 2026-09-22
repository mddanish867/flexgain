import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { MuscleGroup, MuscleLog } from "./types";

interface MuscleRow {
  id: string;
  user_id: string;
  date: string;
  muscle_group: MuscleGroup;
  soreness: number;
  trained: boolean;
}

function fromRow(r: MuscleRow): MuscleLog {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    muscleGroup: r.muscle_group,
    soreness: Number(r.soreness),
    trained: r.trained,
  };
}

export async function listMuscleLogs(
  userId: string,
  date?: string,
): Promise<MuscleLog[]> {
  const rows = date
    ? await query<MuscleRow>(
        "SELECT * FROM muscle_logs WHERE user_id = $1 AND date = $2",
        [userId, date],
      )
    : await query<MuscleRow>("SELECT * FROM muscle_logs WHERE user_id = $1", [
        userId,
      ]);
  return rows.map(fromRow);
}

export async function logMuscle(
  userId: string,
  input: Omit<MuscleLog, "id" | "userId">,
): Promise<MuscleLog> {
  const rows = await query<MuscleRow>(
    `INSERT INTO muscle_logs (id, user_id, date, muscle_group, soreness, trained)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, date, muscle_group) DO UPDATE
       SET soreness = EXCLUDED.soreness, trained = EXCLUDED.trained
     RETURNING *`,
    [randomUUID(), userId, input.date, input.muscleGroup, input.soreness, input.trained],
  );
  return fromRow(rows[0]!);
}

/**
 * Current soreness per muscle group — the most recent reading inside the
 * window, not the worst one.
 *
 * This previously took a 7-day maximum, which meant one brutal leg day
 * kept legs showing red until it aged out, even after the user had logged
 * themselves fully recovered. Groups with no reading in the window report
 * 0.
 */
export async function sorenessByGroup(
  userId: string,
  sinceDays = 7,
): Promise<Record<MuscleGroup, number>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  // DISTINCT ON keeps the first row of each group under this ordering,
  // i.e. the latest date that group was logged.
  const rows = await query<MuscleRow>(
    `SELECT DISTINCT ON (muscle_group) *
       FROM muscle_logs
      WHERE user_id = $1 AND date >= $2
      ORDER BY muscle_group, date DESC`,
    [userId, cutoffStr],
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
  for (const row of rows.map(fromRow)) {
    result[row.muscleGroup] = row.soreness;
  }
  return result;
}
