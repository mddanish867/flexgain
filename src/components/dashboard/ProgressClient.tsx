"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Button } from "@/components/ui/Button";
import { BodyMap } from "@/components/dashboard/BodyMap";
import { apiGet, apiPost } from "@/lib/client";
import { formatWeight, fromKg } from "@/lib/units";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type {
  DietPlan,
  Exercise,
  Meal,
  MuscleGroup,
  NutritionLog,
  PublicUser,
  WeightEntry,
} from "@/lib/types";

interface DashboardData {
  today: string;
  settings: PublicUser["settings"];
  exercises: Exercise[];
  nutrition: { today: NutritionLog | null; history: NutritionLog[] };
  weights: WeightEntry[];
  sorenessByGroup: Record<string, number>;
  diet: DietPlan | null;
  currentWeight: number | null;
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  full_body: "Full body",
};

const MUSCLE_KEYS: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
];

/**
 * How far the user has moved from where they started toward their goal.
 *
 * Progress needs three points, not two: the same 80 kg is 0% done for
 * someone who started at 80 and 100% done for someone who started at 95.
 * The baseline is the first recorded weight, so this works the same for
 * cutting (goal below start) and bulking (goal above it).
 */
function goalProgressPct(
  startKg: number | null,
  currentKg: number | null,
  goalKg: number,
): number {
  if (startKg === null || currentKg === null) return 0;
  const span = goalKg - startKg;
  // Started at the goal: it's met exactly while they stay there.
  if (Math.abs(span) < 0.05) {
    return Math.abs(currentKg - goalKg) < 0.05 ? 100 : 0;
  }
  const moved = currentKg - startKg;
  return Math.max(0, Math.min(100, (moved / span) * 100));
}

export function ProgressClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muscleForm, setMuscleForm] = useState<Record<MuscleGroup, { soreness: number; trained: boolean }>>(
    {
      chest: { soreness: 0, trained: false },
      back: { soreness: 0, trained: false },
      legs: { soreness: 0, trained: false },
      shoulders: { soreness: 0, trained: false },
      arms: { soreness: 0, trained: false },
      core: { soreness: 0, trained: false },
      full_body: { soreness: 0, trained: false },
    },
  );
  const [savingMuscle, setSavingMuscle] = useState(false);
  const [dietMeals, setDietMeals] = useState<Meal[]>([]);
  const [savingDiet, setSavingDiet] = useState(false);

  async function refresh() {
    try {
      const d = await apiGet<DashboardData>("/api/dashboard");
      setData(d);
      const next = { ...muscleForm };
      // pre-fill soreness values from server if present
      for (const g of MUSCLE_KEYS) {
        next[g] = {
          soreness: d.sorenessByGroup[g] ?? 0,
          trained: false,
        };
      }
      setMuscleForm(next);
      if (d.diet) setDietMeals(d.diet.meals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.weights.map((w) => ({
      date: w.date.slice(5),
      weight: Number(fromKg(w.weightKg, data.settings.units).toFixed(1)),
    }));
  }, [data]);

  async function saveMuscle(g: MuscleGroup) {
    if (!data) return;
    setSavingMuscle(true);
    try {
      await apiPost("/api/muscles", {
        date: data.today,
        muscleGroup: g,
        soreness: muscleForm[g].soreness,
        trained: muscleForm[g].trained,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMuscle(false);
    }
  }

  function addMeal() {
    setDietMeals((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        name: "",
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      },
    ]);
  }

  function updateMeal(id: string, patch: Partial<Meal>) {
    setDietMeals((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removeMeal(id: string) {
    setDietMeals((m) => m.filter((x) => x.id !== id));
  }

  async function saveDiet() {
    if (!data) return;
    setSavingDiet(true);
    try {
      await apiPost("/api/diet", { date: data.today, meals: dietMeals });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingDiet(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-5xl mx-auto flex items-center gap-3 text-fg-muted">
        <Loader2 className="animate-spin" size={18} /> Loading progress…
      </div>
    );
  }
  if (!data) return null;

  const units = data.settings.units;
  const cw = data.currentWeight;
  const startKg = data.weights.length ? data.weights[0]!.weightKg : null;
  const goalPct = Math.round(
    goalProgressPct(startKg, cw, data.settings.weightGoalKg),
  );
  // One number drives both the headline and the ring, so they can't drift.
  const ringPct = goalPct;

  const totalCal = dietMeals.reduce((a, b) => a + b.calories, 0);
  const totalProtein = dietMeals.reduce((a, b) => a + b.proteinG, 0);

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <MonoLabel className="block">PROGRESS · {new Date().toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</MonoLabel>
      </div>
      <h1 className="text-3xl font-semibold mb-6">Progress</h1>

      <MonoLabel>THE LONG GAME</MonoLabel>
      <h2 className="text-3xl sm:text-4xl font-semibold mt-2 mb-2">
        Progress <span className="text-accent-red">compounds.</span>
      </h2>
      <p className="text-fg-muted text-sm mb-6">
        Your weekly view of the work behind the weight.
      </p>

      {error && <p className="text-accent-red text-sm mb-3">{error}</p>}

      <Card accent className="mb-6">
        <CardHeader eyebrow="GOAL COMPLETION" />
        <CardBody className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold">{goalPct}</span>
              <span className="text-accent-red text-xl">%</span>
            </div>
            <p className="text-fg-muted text-sm mt-2 font-mono-label">
              {formatWeight(cw, units, { withUnit: true })} CURRENT →{" "}
              {formatWeight(data.settings.weightGoalKg, units, { withUnit: true })} GOAL
            </p>
          </div>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#FF3B30"
                strokeWidth="3"
                strokeDasharray={`${ringPct} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
              <div className="text-fg font-semibold">{Math.round(ringPct)}%</div>
              <div className="text-fg-dim font-mono-label text-[9px]">to goal</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          eyebrow="WEIGHT HISTORY"
          title={`${data.weights.length} entries`}
        />
        <CardBody>
          {data.weights.length === 0 ? (
            <p className="text-fg-muted text-sm">
              No weight entries yet. Log one on the Nutrition page.
            </p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #1A1A1A",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#888" }}
                      itemStyle={{ color: "#FF3B30" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#FF3B30"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-fg-dim font-mono-label uppercase border-b border-border sticky top-0 bg-bg-panel">
                    <tr>
                      <th className="text-left px-2 py-2">Date</th>
                      <th className="text-right px-2 py-2">Weight</th>
                      <th className="text-right px-2 py-2">Calories</th>
                      <th className="text-right px-2 py-2">Protein</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.nutrition.history].slice(0, 30).map((n) => (
                      <tr
                        key={n.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-2 py-2">{n.date}</td>
                        <td className="px-2 py-2 text-right">
                          {formatWeight(n.weightKg, units, { withUnit: true })}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {n.calories} kcal
                        </td>
                        <td className="px-2 py-2 text-right">
                          {n.proteinG} g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader eyebrow="MUSCLE MAP" title="Today’s soreness" />
          <CardBody>
            <BodyMap soreness={data.sorenessByGroup} />
            <div className="mt-4 space-y-2">
              {MUSCLE_KEYS.map((g) => (
                <div
                  key={g}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="w-16 text-xs text-fg-muted font-mono-label">
                    {MUSCLE_LABELS[g]}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={muscleForm[g].soreness}
                    onChange={(e) =>
                      setMuscleForm((f) => ({
                        ...f,
                        [g]: { ...f[g], soreness: Number(e.target.value) },
                      }))
                    }
                    className="flex-1 accent-accent-red"
                  />
                  <span className="w-6 text-right text-xs">
                    {muscleForm[g].soreness}
                  </span>
                  <label className="flex items-center gap-1 text-xs text-fg-dim">
                    <input
                      type="checkbox"
                      checked={muscleForm[g].trained}
                      onChange={(e) =>
                        setMuscleForm((f) => ({
                          ...f,
                          [g]: { ...f[g], trained: e.target.checked },
                        }))
                      }
                      className="accent-accent-red"
                    />
                    trained
                  </label>
                  <button
                    onClick={() => saveMuscle(g)}
                    disabled={savingMuscle}
                    className="text-fg-dim hover:text-accent-red"
                    title="Save"
                  >
                    <Save size={14} />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            eyebrow="DIET PLAN"
            title="Today’s plan"
          />
          <div className="px-5">
            <Button size="sm" variant="ghost" onClick={addMeal}>
              <Plus size={12} /> Meal
            </Button>
          </div>
          <CardBody>
            {dietMeals.length === 0 ? (
              <p className="text-fg-muted text-sm mb-3">
                No meals planned. Add one to start your day.
              </p>
            ) : (
              <ul className="space-y-2 mb-3">
                {dietMeals.map((meal) => (
                  <li
                    key={meal.id}
                    className="grid grid-cols-12 gap-2 items-center border border-border rounded p-2"
                  >
                    <input
                      type="text"
                      placeholder="Meal"
                      value={meal.name}
                      onChange={(e) =>
                        updateMeal(meal.id, { name: e.target.value })
                      }
                      className="col-span-4 bg-bg border border-border rounded px-2 h-8 text-sm focus:outline-none focus:border-accent-red"
                    />
                    <input
                      type="number"
                      placeholder="kcal"
                      value={meal.calories || ""}
                      onChange={(e) =>
                        updateMeal(meal.id, {
                          calories: Number(e.target.value),
                        })
                      }
                      className="col-span-2 bg-bg border border-border rounded px-2 h-8 text-sm focus:outline-none focus:border-accent-red"
                    />
                    <input
                      type="number"
                      placeholder="P"
                      value={meal.proteinG || ""}
                      onChange={(e) =>
                        updateMeal(meal.id, {
                          proteinG: Number(e.target.value),
                        })
                      }
                      className="col-span-2 bg-bg border border-border rounded px-2 h-8 text-sm focus:outline-none focus:border-accent-red"
                    />
                    <input
                      type="number"
                      placeholder="C"
                      value={meal.carbsG || ""}
                      onChange={(e) =>
                        updateMeal(meal.id, { carbsG: Number(e.target.value) })
                      }
                      className="col-span-1 bg-bg border border-border rounded px-2 h-8 text-sm focus:outline-none focus:border-accent-red"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      value={meal.fatG || ""}
                      onChange={(e) =>
                        updateMeal(meal.id, { fatG: Number(e.target.value) })
                      }
                      className="col-span-1 bg-bg border border-border rounded px-2 h-8 text-sm focus:outline-none focus:border-accent-red"
                    />
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="col-span-2 text-fg-dim hover:text-accent-red inline-flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between text-sm font-mono-label border-t border-border pt-3 mb-3">
              <span className="text-fg-muted">TOTALS</span>
              <span>
                {totalCal.toLocaleString()} kcal · {totalProtein} g protein
              </span>
            </div>
            <Button
              variant="primary"
              onClick={saveDiet}
              disabled={savingDiet}
              fullWidth
            >
              {savingDiet ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              Save plan
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
