/**
 * User repository — the only place that mutates the users table.
 */
import { randomUUID } from "node:crypto";
import { query } from "./db";
import { hashPassword } from "./password";
import type { PublicUser, User, UserSettings } from "./types";

export const DEFAULT_SETTINGS: UserSettings = {
  weightGoalKg: 80,
  calorieGoal: 2400,
  proteinGoal: 180,
  units: "kg",
};

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  weight_goal_kg: number;
  calorie_goal: number;
  protein_goal: number;
  units: "kg" | "lb";
  token_version: number;
}

function fromRow(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    passwordHash: r.password_hash,
    passwordSalt: r.password_salt,
    createdAt: Number(r.created_at),
    tokenVersion: Number(r.token_version),
    settings: {
      weightGoalKg: Number(r.weight_goal_kg),
      calorieGoal: Number(r.calorie_goal),
      proteinGoal: Number(r.protein_goal),
      units: r.units,
    },
  };
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    settings: u.settings,
  };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await query<UserRow>("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  settings?: UserSettings;
}): Promise<User> {
  const email = input.email.toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }
  const { hash, salt } = await hashPassword(input.password);
  const settings = input.settings ?? DEFAULT_SETTINGS;
  const rows = await query<UserRow>(
    `INSERT INTO users
       (id, email, name, password_hash, password_salt, created_at,
        weight_goal_kg, calorie_goal, protein_goal, units)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      randomUUID(),
      email,
      input.name.trim(),
      hash,
      salt,
      Date.now(),
      settings.weightGoalKg,
      settings.calorieGoal,
      settings.proteinGoal,
      settings.units,
    ],
  );
  return fromRow(rows[0]!);
}

export async function updateUser(
  id: string,
  patch: Partial<{ name: string; settings: UserSettings }>,
): Promise<User | undefined> {
  const existing = await findUserById(id);
  if (!existing) return undefined;
  const name = patch.name ?? existing.name;
  const settings = patch.settings ?? existing.settings;
  const rows = await query<UserRow>(
    `UPDATE users
        SET name = $2, weight_goal_kg = $3, calorie_goal = $4,
            protein_goal = $5, units = $6
      WHERE id = $1
      RETURNING *`,
    [id, name, settings.weightGoalKg, settings.calorieGoal, settings.proteinGoal, settings.units],
  );
  return rows[0] ? fromRow(rows[0]) : undefined;
}

/**
 * Invalidates every session issued so far for this user by bumping the
 * version that sessions are checked against. Used by "sign out
 * everywhere" — stateless JWTs can't be revoked individually, so the
 * server changes what it will accept instead.
 */
export async function bumpTokenVersion(id: string): Promise<number | undefined> {
  const rows = await query<{ token_version: number }>(
    `UPDATE users SET token_version = token_version + 1
      WHERE id = $1
      RETURNING token_version`,
    [id],
  );
  return rows[0] ? Number(rows[0].token_version) : undefined;
}
