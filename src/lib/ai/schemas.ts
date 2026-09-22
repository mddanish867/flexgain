/**
 * Response contracts for every AI call.
 *
 * Each shape is declared twice on purpose: once as a Gemini
 * `responseSchema` (which constrains decoding, so the model emits the
 * right structure) and once as a zod schema (which validates the values
 * after the fact). The first stops malformed JSON; the second stops
 * plausible-looking nonsense like 400 sets or a muscle id we can't draw.
 */
import { z } from "zod";
import { MUSCLE_IDS } from "./muscles";
import type { ResponseSchema } from "./gemini";

const muscleEnum = [...MUSCLE_IDS] as string[];

/**
 * A string field whose length is a display concern, not a correctness one.
 *
 * Free text comes back a little over budget often enough that rejecting it
 * would throw away an otherwise perfect answer — and a plan generation
 * costs real money and ~30 seconds. So over-long prose is trimmed rather
 * than refused. Numbers and enums stay strict, because a wrong number is
 * wrong, not merely long.
 */
/**
 * Normalises a meal time to HH:MM.
 *
 * The model sometimes answers with a range or an annotation ("16:00 /
 * 18:00", "8:00 AM pre-workout"). Blindly truncating that produced
 * "16:00 /…" in the UI, so pull out the first clock time instead and
 * fall back to empty rather than showing something mangled.
 */
const clockTime = z.string().transform((v) => {
  const m = v.match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const hh = Math.min(23, Number(m[1])).toString().padStart(2, "0");
  return `${hh}:${m[2]}`;
});

function capped(max: number) {
  return z
    .string()
    .transform((v) =>
      v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v,
    );
}


/* ------------------------------------------------------------------ */
/* Exercise auto-fill                                                   */
/* ------------------------------------------------------------------ */

export const exerciseFillSchema: ResponseSchema = {
  type: "object",
  properties: {
    canonicalName: {
      type: "string",
      description: "The standard name for this exercise, corrected for typos.",
    },
    recognized: {
      type: "boolean",
      description: "False if the input is not a real exercise.",
    },
    description: {
      type: "string",
      description:
        "2-4 sentences: what it trains, how to perform it, one form cue.",
    },
    primaryMuscles: { type: "array", items: { type: "string", enum: muscleEnum } },
    secondaryMuscles: { type: "array", items: { type: "string", enum: muscleEnum } },
    equipment: { type: "string" },
    isBodyweight: { type: "boolean" },
    sets: { type: "integer" },
    reps: { type: "integer" },
    suggestedWeightKg: {
      type: "number",
      description: "0 for bodyweight movements.",
    },
    restSeconds: { type: "integer" },
    difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
    formTips: { type: "array", items: { type: "string" } },
  },
  required: [
    "canonicalName", "recognized", "description", "primaryMuscles",
    "secondaryMuscles", "equipment", "isBodyweight", "sets", "reps",
    "suggestedWeightKg", "restSeconds", "difficulty", "formTips",
  ],
};

export const ExerciseFill = z.object({
  canonicalName: capped(100),
  recognized: z.boolean(),
  description: capped(500),
  primaryMuscles: z.array(z.enum(MUSCLE_IDS)).max(6),
  secondaryMuscles: z.array(z.enum(MUSCLE_IDS)).max(8),
  equipment: capped(60),
  isBodyweight: z.boolean(),
  // Bounds match what the exercises API already accepts, so an AI answer
  // can always be saved without a second round of correction.
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  suggestedWeightKg: z.number().min(0).max(500),
  restSeconds: z.number().int().min(0).max(600),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  formTips: z.array(capped(200)).max(8),
});
export type ExerciseFill = z.infer<typeof ExerciseFill>;

/* ------------------------------------------------------------------ */
/* Daily nutrition targets                                              */
/* ------------------------------------------------------------------ */

export const nutritionTargetSchema: ResponseSchema = {
  type: "object",
  properties: {
    calories: { type: "integer" },
    proteinG: { type: "integer" },
    carbsG: { type: "integer" },
    fatG: { type: "integer" },
    rationale: { type: "string" },
    meals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          time: { type: "string", description: "HH:MM, 24-hour." },
          calories: { type: "integer" },
          proteinG: { type: "integer" },
          carbsG: { type: "integer" },
          fatG: { type: "integer" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["name", "time", "calories", "proteinG", "carbsG", "fatG", "items"],
      },
    },
  },
  required: ["calories", "proteinG", "carbsG", "fatG", "rationale", "meals"],
};

export const NutritionTarget = z.object({
  calories: z.number().int().min(800).max(8000),
  proteinG: z.number().int().min(20).max(600),
  carbsG: z.number().int().min(0).max(1200),
  fatG: z.number().int().min(0).max(400),
  rationale: capped(800),
  meals: z
    .array(
      z.object({
        name: capped(100),
        time: clockTime,
        calories: z.number().min(0).max(5000),
        proteinG: z.number().min(0).max(300),
        carbsG: z.number().min(0).max(500),
        fatG: z.number().min(0).max(300),
        items: z.array(capped(160)).max(16),
      }),
    )
    .max(8),
});
export type NutritionTarget = z.infer<typeof NutritionTarget>;

/* ------------------------------------------------------------------ */
/* Goal-driven training plan                                            */
/* ------------------------------------------------------------------ */

const planExercise: ResponseSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    primaryMuscles: { type: "array", items: { type: "string", enum: muscleEnum } },
    secondaryMuscles: { type: "array", items: { type: "string", enum: muscleEnum } },
    sets: { type: "integer" },
    reps: { type: "integer" },
    suggestedWeightKg: { type: "number" },
    restSeconds: { type: "integer" },
    why: { type: "string", description: "Why this movement earns its place." },
    intensity: { type: "string", enum: ["standard", "high", "extreme"] },
  },
  required: [
    "name", "primaryMuscles", "secondaryMuscles", "sets", "reps",
    "suggestedWeightKg", "restSeconds", "why", "intensity",
  ],
};

export const planSchema: ResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    weeks: { type: "integer" },
    focusMuscles: { type: "array", items: { type: "string", enum: muscleEnum } },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dayOfWeek: { type: "integer", description: "1 = Monday .. 7 = Sunday" },
          label: { type: "string" },
          isRest: { type: "boolean" },
          exercises: { type: "array", items: planExercise },
        },
        required: ["dayOfWeek", "label", "isRest", "exercises"],
      },
    },
    nutrition: nutritionTargetSchema,
    keyPoints: { type: "array", items: { type: "string" } },
  },
  required: ["title", "summary", "weeks", "focusMuscles", "days", "nutrition", "keyPoints"],
};

export const PlanExercise = z.object({
  name: capped(100),
  primaryMuscles: z.array(z.enum(MUSCLE_IDS)).max(6),
  secondaryMuscles: z.array(z.enum(MUSCLE_IDS)).max(8),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  suggestedWeightKg: z.number().min(0).max(500),
  restSeconds: z.number().int().min(0).max(600),
  why: capped(300),
  intensity: z.enum(["standard", "high", "extreme"]),
});
export type PlanExercise = z.infer<typeof PlanExercise>;

export const Plan = z.object({
  title: capped(120),
  summary: capped(1200),
  weeks: z.number().int().min(1).max(52),
  focusMuscles: z.array(z.enum(MUSCLE_IDS)).max(10),
  days: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(1).max(7),
        label: capped(60),
        isRest: z.boolean(),
        exercises: z.array(PlanExercise).max(12),
      }),
    )
    .max(7),
  nutrition: NutritionTarget,
  keyPoints: z.array(capped(400)).max(10),
});
export type Plan = z.infer<typeof Plan>;
