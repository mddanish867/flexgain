"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui/Card";
import { BigStat } from "@/components/ui/BigStat";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiGet, apiPost } from "@/lib/client";
import { formatWeight, fromKg, toKg } from "@/lib/units";
import {
  Dumbbell,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type {
  DietPlan,
  Exercise,
  NutritionLog,
  PublicUser,
  WeightEntry,
} from "@/lib/types";

interface DashboardData {
  today: string;
  settings: PublicUser["settings"];
  exercises: Exercise[];
  nutrition: {
    today: NutritionLog | null;
    history: NutritionLog[];
  };
  weights: WeightEntry[];
  sorenessByGroup: Record<string, number>;
  diet: DietPlan | null;
  currentWeight: number | null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

function dayOfWeek(date = new Date()): number {
  // 1 = Mon ... 7 = Sun
  const js = date.getDay(); // 0 = Sun
  return js === 0 ? 7 : js;
}

export function OverviewClient({ user }: { user: { name: string } }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(dayOfWeek());
  const [error, setError] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({
    weightKg: "",
    calories: "",
    proteinG: "",
    notes: "",
  });
  const [savingLog, setSavingLog] = useState(false);

  async function refresh() {
    try {
      const d = await apiGet<DashboardData>("/api/dashboard");
      setData(d);
      if (d.nutrition.today) {
        setLogForm({
          weightKg:
            d.nutrition.today.weightKg === null
              ? ""
              : formatWeight(d.nutrition.today.weightKg, d.settings.units),
          calories: String(d.nutrition.today.calories ?? ""),
          proteinG: String(d.nutrition.today.proteinG ?? ""),
          notes: d.nutrition.today.notes ?? "",
        });
      } else if (d.currentWeight != null) {
        setLogForm((f) => ({
          ...f,
          weightKg: formatWeight(d.currentWeight, d.settings.units),
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const days = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek(today) + 6) % 7));
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        dayOfWeek: i + 1,
        date: d,
        label: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        num: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
      };
    });
  }, []);

  const todaysExercises = useMemo(
    () => (data?.exercises ?? []).filter((e) => e.dayOfWeek === selectedDay),
    [data, selectedDay],
  );

  async function saveQuickLog() {
    if (!data) return;
    setSavingLog(true);
    try {
      const typedWeight = logForm.weightKg.trim();
      await apiPost("/api/nutrition", {
        date: data.today,
        // Blank means "didn't weigh in today", not zero.
        weightKg: typedWeight
          ? toKg(Number(typedWeight), data.settings.units)
          : null,
        calories: Number(logForm.calories) || 0,
        proteinG: Number(logForm.proteinG) || 0,
        notes: logForm.notes,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingLog(false);
    }
  }

  async function deleteExercise(ex: Exercise) {
    if (!confirm(`Delete "${ex.name}"?`)) return;
    try {
      await fetch(`/api/exercises/${ex.id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-5xl mx-auto flex items-center gap-3 text-fg-muted">
        <Loader2 className="animate-spin" size={18} /> Loading dashboard…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-5xl mx-auto text-accent-red">
        {error}
      </div>
    );
  }

  if (!data) return null;
  const consumed = data.nutrition.today?.calories ?? 0;
  const protein = data.nutrition.today?.proteinG ?? 0;
  const units = data.settings.units;
  const currentWeight = data.currentWeight;
  const remainingToGoal =
    currentWeight === null ? null : data.settings.weightGoalKg - currentWeight;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <MonoLabel className="block mb-2">
          OVERVIEW · {todayLabel()}
        </MonoLabel>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {greeting()},{" "}
            <span className="text-accent-red">
              {user.name.split(" ")[0]}
            </span>
            .
          </h1>
          <Badge tone="red">TODAY</Badge>
        </div>
        <p className="text-fg-muted text-sm mt-2">
          Discipline is a daily decision. Here is where you stand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card accent>
          <CardHeader eyebrow="CURRENT WEIGHT" />
          <CardBody>
            <BigStat
              label=""
              value={formatWeight(currentWeight, units)}
              unit={currentWeight === null ? "" : units}
              delta={
                remainingToGoal === null ? (
                  <span className="text-fg-muted">No weight logged yet</span>
                ) : Math.abs(remainingToGoal) < 0.05 ? (
                  <span className="text-accent-green">at goal</span>
                ) : (
                  <span className="text-fg-muted">
                    {remainingToGoal < 0 ? "↓" : "↑"}{" "}
                    {Math.abs(fromKg(remainingToGoal, units)).toFixed(1)} {units}{" "}
                    to {formatWeight(data.settings.weightGoalKg, units)} goal
                  </span>
                )
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader eyebrow="CALORIE TARGET" />
          <CardBody>
            <BigStat
              label=""
              value={`${consumed.toLocaleString()} / ${data.settings.calorieGoal.toLocaleString()}`}
              unit="kcal"
              delta={
                <div className="mt-2">
                  <ProgressBar
                    value={Math.min(1, consumed / data.settings.calorieGoal)}
                    tone={consumed > data.settings.calorieGoal ? "red" : "green"}
                  />
                  <p className="text-xs text-fg-dim mt-2 font-mono-label">
                    {consumed > data.settings.calorieGoal
                      ? `+${consumed - data.settings.calorieGoal} surplus built in`
                      : `${data.settings.calorieGoal - consumed} remaining`}
                  </p>
                </div>
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader eyebrow="PROTEIN TARGET" />
          <CardBody>
            <BigStat
              label=""
              value={`${protein} / ${data.settings.proteinGoal}`}
              unit="g"
              tone="red"
              delta={
                <div className="mt-2">
                  <ProgressBar
                    value={Math.min(1, protein / data.settings.proteinGoal)}
                    tone="green"
                  />
                  <p className="text-xs text-fg-dim mt-2 font-mono-label">
                    {protein >= data.settings.proteinGoal
                      ? "✓ fueled your growth"
                      : "fuel your growth"}
                  </p>
                </div>
              }
            />
          </CardBody>
        </Card>
      </div>

      <div className="mb-8">
        <MonoLabel className="block mb-2">THIS WEEK</MonoLabel>
        <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Training schedule</h2>
          <a
            href="/dashboard/workouts"
            className="inline-flex items-center gap-2 text-xs border border-border-strong px-3 h-9 rounded hover:border-accent-red transition-colors"
          >
            <Plus size={14} /> Custom exercise
          </a>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((d) => (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDay(d.dayOfWeek)}
              className={`flex flex-col items-center py-2 border rounded transition-colors ${
                selectedDay === d.dayOfWeek
                  ? "border-accent-red bg-bg-panel"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <span className="font-mono-label text-[10px] text-fg-dim">
                {d.label}
              </span>
              <span className="text-lg font-semibold mt-1">{d.num}</span>
              {d.isToday && (
                <span className="block w-1.5 h-1.5 rounded-full bg-accent-red mt-1" />
              )}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader
            eyebrow={`${dayNames[selectedDay - 1]} · ${todaysExercises.length} EXERCISES`}
            title={
              todaysExercises.length === 0
                ? "Rest day"
                : "Today\u2019s plan"
            }
          />
          <CardBody>
            {todaysExercises.length === 0 ? (
              <p className="text-fg-muted text-sm">
                Rest day. Add a custom exercise to make it count.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {todaysExercises.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center gap-3 py-3 group"
                  >
                    {ex.imageId ? (
                      <img
                        src={`/api/images/${ex.imageId}`}
                        alt=""
                        className="w-12 h-12 rounded object-cover bg-bg-panel"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-bg-panel flex items-center justify-center">
                        <Dumbbell size={18} className="text-fg-dim" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{ex.name}</div>
                      <div className="text-xs text-fg-muted font-mono-label">
                        {ex.sets} × {ex.reps} ·{" "}
                        {ex.weightKg > 0
                          ? formatWeight(ex.weightKg, units, { withUnit: true })
                          : "Bodyweight"}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteExercise(ex)}
                      className="opacity-0 group-hover:opacity-100 text-fg-dim hover:text-accent-red transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mb-10">
        <MonoLabel className="block mb-2">QUICK LOG</MonoLabel>
        <h2 className="text-xl font-semibold mb-3">Today&apos;s numbers</h2>
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-xs text-fg-dim font-mono-label">
                Weight ({units})
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="optional"
                  value={logForm.weightKg}
                  onChange={(e) =>
                    setLogForm((f) => ({ ...f, weightKg: e.target.value }))
                  }
                  className="mt-1 w-full bg-bg-panel border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Calories
                <input
                  type="number"
                  inputMode="numeric"
                  value={logForm.calories}
                  onChange={(e) =>
                    setLogForm((f) => ({ ...f, calories: e.target.value }))
                  }
                  className="mt-1 w-full bg-bg-panel border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Protein (g)
                <input
                  type="number"
                  inputMode="numeric"
                  value={logForm.proteinG}
                  onChange={(e) =>
                    setLogForm((f) => ({ ...f, proteinG: e.target.value }))
                  }
                  className="mt-1 w-full bg-bg-panel border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={saveQuickLog}
                  disabled={savingLog}
                  className="w-full bg-accent-red text-white h-10 rounded font-medium inline-flex items-center justify-center gap-2 hover:bg-accent-red-hover disabled:opacity-60"
                >
                  {savingLog ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
