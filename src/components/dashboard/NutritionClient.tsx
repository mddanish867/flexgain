"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BigStat } from "@/components/ui/BigStat";
import { apiGet, apiPost, apiDelete } from "@/lib/client";
import { Loader2, Save, Trash2 } from "lucide-react";
import type { NutritionLog } from "@/lib/types";

interface DashboardData {
  today: string;
  settings: { calorieGoal: number; proteinGoal: number; units: string };
  nutrition: {
    today: NutritionLog | null;
    history: NutritionLog[];
  };
}

export function NutritionClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    weightKg: "",
    calories: "",
    proteinG: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const d = await apiGet<DashboardData>("/api/dashboard");
      setData(d);
      setForm({
        weightKg: String(d.nutrition.today?.weightKg ?? ""),
        calories: String(d.nutrition.today?.calories ?? ""),
        proteinG: String(d.nutrition.today?.proteinG ?? ""),
        notes: d.nutrition.today?.notes ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveLog() {
    if (!data) return;
    setSaving(true);
    try {
      await apiPost("/api/nutrition", {
        date: data.today,
        weightKg: Number(form.weightKg) || 0,
        calories: Number(form.calories) || 0,
        proteinG: Number(form.proteinG) || 0,
        notes: form.notes,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeLog(id: string) {
    if (!confirm("Delete this log?")) return;
    try {
      await apiDelete(`/api/nutrition/${id}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="px-5 sm:px-8 py-10 max-w-5xl mx-auto flex items-center gap-3 text-fg-muted">
        <Loader2 className="animate-spin" size={18} /> Loading nutrition…
      </div>
    );
  }
  if (!data) return null;

  const consumed = data.nutrition.today?.calories ?? 0;
  const protein = data.nutrition.today?.proteinG ?? 0;
  const calPct = Math.min(1, consumed / data.settings.calorieGoal);
  const proPct = Math.min(1, protein / data.settings.proteinGoal);

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <MonoLabel className="block">NUTRITION · {new Date().toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</MonoLabel>
      </div>
      <h1 className="text-3xl font-semibold mb-6">Nutrition</h1>

      <MonoLabel>FUEL THE WORK</MonoLabel>
      <h2 className="text-3xl sm:text-4xl font-semibold mt-2 mb-2">
        Nutrition <span className="text-accent-red">targets.</span>
      </h2>
      <p className="text-fg-muted text-sm mb-6">
        A small surplus, repeated every day.
      </p>

      {error && <p className="text-accent-red text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card accent>
          <CardHeader eyebrow="CALORIES" />
          <CardBody className="flex items-end justify-between">
            <BigStat
              label=""
              value={data.settings.calorieGoal.toLocaleString()}
              unit="kcal"
              tone="red"
            />
            <div className="relative w-24 h-24">
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
                  stroke={consumed > data.settings.calorieGoal ? "#FF3B30" : "#34C759"}
                  strokeWidth="3"
                  strokeDasharray={`${calPct * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                <div className="text-fg font-semibold">{Math.round(calPct * 100)}%</div>
                <div className="text-fg-dim font-mono-label text-[9px]">logged</div>
              </div>
            </div>
          </CardBody>
          <CardBody className="pt-0">
            <ProgressBar value={calPct} tone={consumed > data.settings.calorieGoal ? "red" : "green"} />
            <div className="flex justify-between text-[10px] text-fg-dim font-mono-label mt-2">
              <span>0</span>
              <span>{data.settings.calorieGoal.toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>

        <Card accent>
          <CardHeader eyebrow="PROTEIN" />
          <CardBody>
            <BigStat
              label=""
              value={String(data.settings.proteinGoal)}
              unit="g"
              tone="red"
            />
          </CardBody>
          <CardBody className="pt-0">
            <ProgressBar value={proPct} tone="green" />
            <div className="flex justify-between text-[10px] text-fg-dim font-mono-label mt-2">
              <span>0</span>
              <span>{data.settings.proteinGoal}g</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <MonoLabel>LOG TODAY</MonoLabel>
      <h2 className="text-2xl font-semibold mt-2 mb-3">
        Keep the signal honest.
      </h2>
      <Card className="mb-8">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="text-xs text-fg-dim font-mono-label">
              Weight (kg)
              <input
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
              />
            </label>
            <label className="text-xs text-fg-dim font-mono-label">
              Calories eaten
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm({ ...form, calories: e.target.value })}
                className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
              />
            </label>
            <label className="text-xs text-fg-dim font-mono-label">
              Protein (g)
              <input
                type="number"
                value={form.proteinG}
                onChange={(e) => setForm({ ...form, proteinG: e.target.value })}
                className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
              />
            </label>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={saveLog}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                Save log
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <MonoLabel>RECENT</MonoLabel>
      <h2 className="text-2xl font-semibold mt-2 mb-3">Last 30 entries</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-fg-dim font-mono-label uppercase border-b border-border">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Weight</th>
                <th className="text-right px-4 py-2">Calories</th>
                <th className="text-right px-4 py-2">Protein</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {data.nutrition.history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-fg-muted py-6 text-sm"
                  >
                    No logs yet. Save your first entry above.
                  </td>
                </tr>
              ) : (
                data.nutrition.history.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">{log.date}</td>
                    <td className="px-4 py-3 text-right">{log.weightKg} kg</td>
                    <td className="px-4 py-3 text-right">{log.calories}</td>
                    <td className="px-4 py-3 text-right">{log.proteinG} g</td>
                    <td className="px-2">
                      <button
                        onClick={() => removeLog(log.id)}
                        className="text-fg-dim hover:text-accent-red"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
