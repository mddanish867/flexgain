/**
 * User repository — the only place that mutates the in-memory user store.
 * Keeping this isolated makes it easy to swap for a real DB later.
 */
import { randomUUID } from "node:crypto";
import { store } from "./store";
import { hashPassword } from "./password";
import type { PublicUser, User } from "./types";

export const DEFAULT_SETTINGS = {
  weightGoalKg: 80,
  calorieGoal: 2400,
  proteinGoal: 180,
  units: "kg" as const,
};

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    settings: u.settings,
  };
}

export function findUserByEmail(email: string): User | undefined {
  const id = store.usersByEmail.get(email.toLowerCase());
  if (!id) return undefined;
  return store.users.get(id);
}

export function findUserById(id: string): User | undefined {
  return store.users.get(id);
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  const email = input.email.toLowerCase().trim();
  if (store.usersByEmail.has(email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const { hash, salt } = await hashPassword(input.password);
  const user: User = {
    id: randomUUID(),
    email,
    name: input.name.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS },
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(email, user.id);
  return user;
}

export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const existing = store.users.get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  store.users.set(id, next);
  return next;
}
