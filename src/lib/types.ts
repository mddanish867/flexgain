/**
 * FlexGain — shared types for the in-memory data store.
 * These shapes are intentionally small. The full dashboard task will
 * expand them with nutrition logs, exercises, weight history, etc.
 */

export type UserUnits = "kg" | "lb";

export interface UserSettings {
  weightGoalKg: number; // always stored in kg internally, displayed per unit
  calorieGoal: number;
  proteinGoal: number;
  units: UserUnits;
}

export interface User {
  id: string;
  email: string;
  name: string;
  /** Salted PBKDF2 hash + salt; never returned to the client */
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
  settings: UserSettings;
}

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  settings: UserSettings;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full_body";

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: number;
  weightKg: number;
  /** 1 = Monday, 7 = Sunday */
  dayOfWeek: number;
  notes: string;
  imageId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NutritionLog {
  id: string;
  userId: string;
  /** YYYY-MM-DD */
  date: string;
  weightKg: number;
  calories: number;
  proteinG: number;
  notes: string;
  createdAt: number;
}

export interface WeightEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
}

export interface MuscleLog {
  id: string;
  userId: string;
  date: string;
  muscleGroup: MuscleGroup;
  soreness: number; // 1..10
  trained: boolean;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  time?: string; // HH:MM
}

export interface DietPlan {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  createdAt: number;
  updatedAt: number;
}
