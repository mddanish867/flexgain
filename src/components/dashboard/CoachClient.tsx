"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MuscleAnatomy } from "@/components/dashboard/MuscleAnatomy";
import { apiGet, apiPost } from "@/lib/client";
import { formatWeight } from "@/lib/units";
import { MUSCLE_LABELS, type MuscleId } from "@/lib/ai/muscles";
import type { UserUnits } from "@/lib/types";
import { Loader2, Sparkles, Flame, Check, AlertTriangle } from "lucide-react";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Matches the server's cap, so the limit is visible before you hit it. */
const GOAL_MAX = 2000;

const GOAL_PLACEHOLDER = `e.g. big biceps with all the cuts showing

...or paste the routine you already follow and it gets built out:
Mon: Back and Biceps
Tue: Legs A (Back Squat, RDL, Leg Press, Leg Curl)
Wed: Chest and Shoulders`;


/**
 * Strips a leading weekday from a day label.
 *
 * When a split is pasted in, the model echoes the user's own wording
 * ("Monday: Back and Biceps"), which would render under a "MON" heading
 * and read twice. The day is already the heading, so drop it.
 */
function trimDayLabel(label: string): string {
  return label
    .replace(
      /^\s*(mon|tues?|wed(nes)?|thur?s?|fri|sat(ur)?|sun)(day)?\s*[:\-–]\s*/i,
      "",
    )
    .trim();
}

interface PlanExercise {
  name: string;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  sets: number;
  reps: number;
  suggestedWeightKg: number;
  restSeconds: number;
  why: string;
  intensity: "standard" | "high" | "extreme";
}

interface Meal {
  name: string;
  time: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: string[];
}

interface Plan {
  title: string;
  summary: string;
  weeks: number;
  focusMuscles: MuscleId[];
  days: Array<{
    dayOfWeek: number;
    label: string;
    isRest: boolean;
    exercises: PlanExercise[];
  }>;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    rationale: string;
    meals: Meal[];
  };
  keyPoints: string[];
}

interface FocusArea {
  id: string;
  label: string;
}

export function CoachClient() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [units, setUnits] = useState<UserUnits>("kg");

  const [goalText, setGoalText] = useState("");
  const [focus, setFocus] = useState("biceps");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experience, setExperience] = useState("intermediate");
  const [equipment, setEquipment] = useState("full gym");

  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<{ enabled: boolean; focusAreas: FocusArea[] }>("/api/ai/status"),
      apiGet<{ settings: { units: UserUnits } }>("/api/settings"),
    ])
      .then(([ai, s]) => {
        setEnabled(ai.enabled);
        setFocusAreas(ai.focusAreas);
        setUnits(s.settings.units);
      })
      .catch(() => setEnabled(false));
  }, []);

  async function generate() {
    if (goalText.trim().length < 3) {
      setError("Describe your goal first.");
      return;
    }
    setGenerating(true);
    setError(null);
    setApplied(null);
    try {
      const res = await apiPost<{ plan: Plan; id: string }>("/api/ai/plan", {
        goalText: goalText.trim(),
        focus,
        daysPerWeek,
        experience,
        equipment,
      });
      setPlan(res.plan);
      setPlanId(res.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build a plan");
    } finally {
      setGenerating(false);
    }
  }

  async function applyPlan() {
    if (!planId) return;
    setApplying(true);
    setError(null);
    try {
      const res = await apiPost<{
        exercisesCreated: number;
        nutritionApplied: boolean;
      }>(`/api/ai/plan/${planId}/apply`, {
        replaceExisting,
        applyNutrition: true,
      });
      setApplied(
        `Added ${res.exercisesCreated} exercises to your week` +
          (res.nutritionApplied ? " and updated your nutrition targets." : "."),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply the plan");
    } finally {
      setApplying(false);
    }
  }

  if (enabled === null) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-5xl mx-auto flex items-center gap-3 text-fg-muted">
        <Loader2 className="animate-spin" size={18} /> Loading coach…
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <MonoLabel className="block mb-2">AI COACH</MonoLabel>
      <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
        Tell it the goal. <span className="text-accent-red">Get the work.</span>
      </h1>
      <p className="text-fg-muted text-sm mb-6">
        A full week of training and the nutrition that backs it, built around
        the muscles you actually want to grow.
      </p>

      {!enabled ? (
        <Card className="border-accent-red/30 mb-6">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-accent-red mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">AI features are switched off</p>
                <p className="text-fg-muted text-sm mt-1">
                  Set <code className="text-accent-red">GEMINI_API_KEY</code> in
                  the environment and restart to enable the coach. Everything
                  else in FlexGain works without it.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader eyebrow="YOUR GOAL" title="What are you building?" />
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-fg-dim font-mono-label">
                Your goal — or paste a split you already follow
                <textarea
                  rows={5}
                  value={goalText}
                  disabled={!enabled}
                  maxLength={GOAL_MAX}
                  placeholder={GOAL_PLACEHOLDER}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent-red resize-y disabled:opacity-50"
                />
              </label>
              <div className="flex justify-between gap-3 mt-1">
                <p className="text-[10px] text-fg-dim">
                  Already have a split? Paste it and the days and exercises
                  you named are kept — sets, reps, loads and muscle targeting
                  get filled in around them.
                </p>
                <span
                  className={
                    "text-[10px] font-mono-label shrink-0 " +
                    (goalText.length > GOAL_MAX - 100
                      ? "text-accent-red"
                      : "text-fg-dim")
                  }
                >
                  {goalText.length}/{GOAL_MAX}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-dim font-mono-label mb-2">
                Focus area
              </p>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setFocus(a.id)}
                    className={
                      "px-3 h-9 rounded border text-sm transition-colors disabled:opacity-50 " +
                      (focus === a.id
                        ? "border-accent-red bg-accent-red/10 text-accent-red"
                        : "border-border text-fg-muted hover:text-fg hover:border-border-strong")
                    }
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs text-fg-dim font-mono-label">
                Days per week{goalText.match(/(mon|tue|wed|thu|fri|sat|sun)/i) ? " (your split wins)" : ""}
                <select
                  value={daysPerWeek}
                  disabled={!enabled}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm text-fg focus:outline-none focus:border-accent-red disabled:opacity-50"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} days
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Experience
                <select
                  value={experience}
                  disabled={!enabled}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm text-fg focus:outline-none focus:border-accent-red disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Equipment
                <input
                  type="text"
                  value={equipment}
                  disabled={!enabled}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm text-fg focus:outline-none focus:border-accent-red disabled:opacity-50"
                />
              </label>
            </div>

            {error ? (
              <p className="text-accent-red text-sm">{error}</p>
            ) : null}

            <Button
              variant="primary"
              onClick={generate}
              disabled={!enabled || generating}
            >
              {generating ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {generating ? "Building your plan…" : "Build my plan"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {plan ? (
        <>
          <Card accent className="mb-4">
            <CardHeader eyebrow={`${plan.weeks}-WEEK BLOCK`} title={plan.title} />
            <CardBody>
              <p className="text-sm text-fg-muted leading-relaxed">
                {plan.summary}
              </p>
              <div className="mt-4 flex gap-4 flex-wrap items-start">
                <div className="w-40 shrink-0">
                  <MuscleAnatomy primary={plan.focusMuscles} showLegend={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-fg-dim font-mono-label mb-2">
                    TARGET MUSCLES
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {plan.focusMuscles.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] font-mono-label px-2 py-1 rounded border border-accent-red/60 text-accent-red"
                      >
                        {MUSCLE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5">
                    {plan.keyPoints.map((k, i) => (
                      <li key={i} className="text-sm text-fg-muted flex gap-2">
                        <Check size={14} className="text-accent-green mt-0.5 shrink-0" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {plan.days
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((day) => (
                <Card key={day.dayOfWeek}>
                  <CardHeader
                    eyebrow={DAY_NAMES[day.dayOfWeek - 1]}
                    title={trimDayLabel(day.label) || day.label}
                  />
                  <CardBody>
                    {day.isRest || day.exercises.length === 0 ? (
                      <p className="text-fg-muted text-sm">
                        Rest. Recovery is where the growth happens.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {day.exercises.map((ex, i) => (
                          <li
                            key={i}
                            className="border-b border-border last:border-0 pb-3 last:pb-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm">{ex.name}</span>
                              {ex.intensity === "extreme" ? (
                                <Badge tone="red">
                                  <Flame size={10} /> EXTREME
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-xs text-fg-muted font-mono-label mt-1">
                              {ex.sets} × {ex.reps} ·{" "}
                              {ex.suggestedWeightKg > 0
                                ? formatWeight(ex.suggestedWeightKg, units, {
                                    withUnit: true,
                                  })
                                : "Bodyweight"}{" "}
                              · {ex.restSeconds}s rest
                            </div>
                            <p className="text-xs text-fg-dim mt-1">{ex.why}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {ex.primaryMuscles.map((m) => (
                                <span
                                  key={m}
                                  className="text-[9px] font-mono-label px-1.5 py-0.5 rounded border border-accent-red/50 text-accent-red"
                                >
                                  {MUSCLE_LABELS[m]}
                                </span>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              ))}
          </div>

          <Card className="mb-4">
            <CardHeader
              eyebrow="NUTRITION"
              title={`${plan.nutrition.calories.toLocaleString()} kcal · ${plan.nutrition.proteinG} g protein`}
              description={plan.nutrition.rationale}
            />
            <CardBody>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  ["CALORIES", `${plan.nutrition.calories}`],
                  ["PROTEIN", `${plan.nutrition.proteinG} g`],
                  ["CARBS", `${plan.nutrition.carbsG} g`],
                  ["FAT", `${plan.nutrition.fatG} g`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border border-border rounded p-2 text-center"
                  >
                    <div className="text-[10px] text-fg-dim font-mono-label">
                      {label}
                    </div>
                    <div className="text-sm font-semibold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {plan.nutrition.meals.map((m, i) => (
                  <li key={i} className="border border-border rounded p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className="text-[10px] text-fg-dim font-mono-label">
                        {m.time}
                      </span>
                    </div>
                    <div className="text-xs text-fg-muted font-mono-label mt-1">
                      {m.calories} kcal · {m.proteinG}P / {m.carbsG}C / {m.fatG}F
                    </div>
                    <p className="text-xs text-fg-dim mt-1">{m.items.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="border-accent-red/30">
            <CardHeader
              eyebrow="MAKE IT REAL"
              title="Apply this plan"
              description="Writes every exercise into your weekly schedule and adopts the nutrition targets."
            />
            <CardBody>
              <label className="flex items-center gap-2 text-sm text-fg-muted mb-3">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="accent-accent-red"
                />
                Replace my current exercises (otherwise these are added)
              </label>
              {applied ? (
                <p className="text-accent-green text-sm mb-3 flex items-center gap-2">
                  <Check size={14} /> {applied}
                </p>
              ) : null}
              <Button variant="primary" onClick={applyPlan} disabled={applying}>
                {applying ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={14} />
                )}
                Apply to my week
              </Button>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
