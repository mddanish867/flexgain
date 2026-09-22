/** Storage for generated training blocks. */
import { randomUUID } from "node:crypto";
import { query } from "../db";
import { Plan } from "./schemas";

export interface StoredPlan {
  id: string;
  goalText: string;
  focus: string;
  plan: Plan;
  createdAt: number;
}

interface PlanRow {
  id: string;
  goal_text: string;
  focus: string;
  payload: unknown;
  created_at: string;
}

function fromRow(r: PlanRow): StoredPlan | null {
  // A stored plan predating a schema change would fail here; skip it
  // rather than breaking the whole list.
  const parsed = Plan.safeParse(r.payload);
  if (!parsed.success) return null;
  return {
    id: r.id,
    goalText: r.goal_text,
    focus: r.focus,
    plan: parsed.data,
    createdAt: Number(r.created_at),
  };
}

export async function savePlan(
  userId: string,
  goalText: string,
  focus: string,
  plan: Plan,
): Promise<StoredPlan> {
  const id = randomUUID();
  const now = Date.now();
  await query(
    `INSERT INTO ai_plans (id, user_id, goal_text, focus, payload, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, userId, goalText, focus, JSON.stringify(plan), now],
  );
  return { id, goalText, focus, plan, createdAt: now };
}

export async function listPlans(
  userId: string,
  limit = 10,
): Promise<StoredPlan[]> {
  const rows = await query<PlanRow>(
    `SELECT * FROM ai_plans WHERE user_id = $1
      ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  );
  return rows.map(fromRow).filter((p): p is StoredPlan => p !== null);
}

export async function getPlan(
  userId: string,
  id: string,
): Promise<StoredPlan | null> {
  const rows = await query<PlanRow>(
    "SELECT * FROM ai_plans WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function deletePlan(userId: string, id: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM ai_plans WHERE user_id = $1 AND id = $2 RETURNING id",
    [userId, id],
  );
  return rows.length > 0;
}
