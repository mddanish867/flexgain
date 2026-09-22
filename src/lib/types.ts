/**
 * FlexGain — shared data shapes.
 * Every persisted entity has a row type in its repository module under
 * src/lib; these are the application-facing shapes those rows map to.
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
  /**
   * Incremented to invalidate every session issued before the bump.
   * Sessions carry this value as `tv`; a mismatch means the token was
   * issued before a "sign out everywhere" and is no longer accepted.
   */
  tokenVersion: number;
}

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  /** Token version this session was issued at; see User.tokenVersion. */
  tv?: number;
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
  /** null when the day was logged without stepping on a scale. */
  weightKg: number | null;
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
