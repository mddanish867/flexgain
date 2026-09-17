/**
 * FlexGain — in-memory data store.
 *
 * ⚠️  DEMO ONLY. This store is process-memory. Every server restart wipes
 *     users, exercises, nutrition logs, weight history, muscle tracking,
 *     diet plans, and any uploaded images. See README for details.
 *
 * We stash state on globalThis so Next.js HMR (which re-evaluates modules
 * in dev) does not reset the Map on every code change. In production a
 * fresh server start still resets everything.
 */
import type {
  DietPlan,
  Exercise,
  MuscleLog,
  NutritionLog,
  User,
  WeightEntry,
} from "./types";

export interface ImageBlob {
  /** base64 data URL or blob URL; demo only */
  src: string;
  mime: string;
  uploadedAt: number;
}

interface StoreShape {
  users: Map<string, User>;
  /** userId -> email -> User index, for fast lookups */
  usersByEmail: Map<string, string>;
  /** uploaded images keyed by imageId */
  images: Map<string, ImageBlob & { ownerId: string }>;
  exercises: Map<string, Exercise[]>;
  nutritionLogs: Map<string, NutritionLog[]>;
  weightEntries: Map<string, WeightEntry[]>;
  muscleLogs: Map<string, MuscleLog[]>;
  dietPlans: Map<string, DietPlan[]>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __FLEXGAIN_STORE__: StoreShape | undefined;
}

function init(): StoreShape {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    images: new Map(),
    exercises: new Map(),
    nutritionLogs: new Map(),
    weightEntries: new Map(),
    muscleLogs: new Map(),
    dietPlans: new Map(),
    seeded: false,
  };
}

export const store: StoreShape = globalThis.__FLEXGAIN_STORE__ ?? init();
if (!globalThis.__FLEXGAIN_STORE__) {
  globalThis.__FLEXGAIN_STORE__ = store;
}

/** Helper to wipe the store — used by tests and the dev "reset" button. */
export function resetStore(): void {
  store.users.clear();
  store.usersByEmail.clear();
  store.images.clear();
  store.exercises.clear();
  store.nutritionLogs.clear();
  store.weightEntries.clear();
  store.muscleLogs.clear();
  store.dietPlans.clear();
  store.seeded = false;
}
