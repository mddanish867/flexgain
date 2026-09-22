"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Button } from "@/components/ui/Button";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/client";
import { formatWeight, fromKg, toKg } from "@/lib/units";
import type { UserUnits } from "@/lib/types";
import { Loader2, Pencil, Plus, Trash2, X, Dumbbell, Sparkles } from "lucide-react";
import { MuscleAnatomy } from "@/components/dashboard/MuscleAnatomy";
import { MUSCLE_LABELS, type MuscleId } from "@/lib/ai/muscles";
import type { Exercise, MuscleGroup } from "@/lib/types";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** What POST /api/ai/exercise returns once validated server-side. */
interface ExerciseFillResult {
  fill: {
    canonicalName: string;
    recognized: boolean;
    description: string;
    primaryMuscles: MuscleId[];
    secondaryMuscles: MuscleId[];
    equipment: string;
    isBodyweight: boolean;
    sets: number;
    reps: number;
    suggestedWeightKg: number;
    restSeconds: number;
    difficulty: string;
    formTips: string[];
  };
  muscleGroup: MuscleGroup;
  cached: boolean;
}

interface FormState {
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: number;
  weightKg: number;
  dayOfWeek: number;
  notes: string;
  imageFile: File | null;
}

const emptyForm: FormState = {
  name: "",
  muscleGroup: "chest",
  sets: 3,
  reps: 10,
  weightKg: 0,
  dayOfWeek: 1,
  notes: "",
  imageFile: null,
};

function labelMuscle(g: MuscleGroup): string {
  if (g === "full_body") return "Full body";
  return g[0]!.toUpperCase() + g.slice(1);
}

export function WorkoutsClient() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [units, setUnits] = useState<UserUnits>("kg");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [filling, setFilling] = useState(false);
  const [fill, setFill] = useState<ExerciseFillResult | null>(null);

  async function refresh() {
    try {
      const [d, s, ai] = await Promise.all([
        apiGet<{ exercises: Exercise[] }>("/api/exercises"),
        apiGet<{ settings: { units: UserUnits } }>("/api/settings"),
        apiGet<{ enabled: boolean }>("/api/ai/status").catch(() => ({
          enabled: false,
        })),
      ]);
      setExercises(d.exercises);
      setUnits(s.settings.units);
      setAiEnabled(ai.enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFill(null);
    setError(null);
    setShowModal(true);
  }

  /**
   * Fills the whole form from the exercise name: what it trains, a
   * description, and a starting prescription. Weight comes back in kg and
   * is converted into whatever unit the form is showing.
   */
  async function autoFill() {
    const name = form.name.trim();
    if (name.length < 2) {
      setError("Type an exercise name first.");
      return;
    }
    setFilling(true);
    setError(null);
    try {
      const res = await apiPost<ExerciseFillResult>("/api/ai/exercise", { name });
      setFill(res);
      setForm((f) => ({
        ...f,
        name: res.fill.canonicalName,
        muscleGroup: res.muscleGroup,
        sets: res.fill.sets,
        reps: res.fill.reps,
        weightKg: Number(fromKg(res.fill.suggestedWeightKg, units).toFixed(1)),
        notes: [res.fill.description, ...res.fill.formTips.map((t) => `• ${t}`)]
          .join("\n")
          .slice(0, 500),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-fill failed");
    } finally {
      setFilling(false);
    }
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setFill(null);
    setError(null);
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets,
      reps: ex.reps,
      weightKg: Number(fromKg(ex.weightKg, units).toFixed(1)),
      dayOfWeek: ex.dayOfWeek,
      notes: ex.notes,
      imageFile: null,
    });
    setShowModal(true);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      let imageId: string | null | undefined = editing?.imageId;
      if (form.imageFile) {
        const fd = new FormData();
        fd.append("file", form.imageFile);
        const res = await fetch("/api/images", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) throw new Error("Image upload failed");
        const data = (await res.json()) as { id: string };
        imageId = data.id;
      }
      const payload = {
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        sets: form.sets,
        reps: form.reps,
        weightKg: toKg(form.weightKg, units),
        dayOfWeek: form.dayOfWeek,
        notes: form.notes,
        imageId: imageId ?? null,
      };
      if (editing) {
        await apiPatch(`/api/exercises/${editing.id}`, payload);
      } else {
        await apiPost("/api/exercises", payload);
      }
      setShowModal(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(ex: Exercise) {
    if (!confirm(`Delete \u201C${ex.name}\u201D?`)) return;
    try {
      // The server drops the attached image as part of this call.
      await apiDelete(`/api/exercises/${ex.id}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <MonoLabel className="block">WORKOUTS · {new Date().toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</MonoLabel>
      </div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-semibold">Workouts</h1>
        <Button variant="outline" onClick={openAdd}>
          <Plus size={16} /> Add exercise
        </Button>
      </div>

      <div className="mb-4">
        <MonoLabel>YOUR MOVEMENT LIBRARY</MonoLabel>
        <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
          Train with <span className="text-accent-red">intent.</span>
        </h2>
      </div>

      {error && (
        <p className="text-accent-red text-sm mb-4">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-fg-muted py-10">
          <Loader2 className="animate-spin" size={18} /> Loading exercises…
        </div>
      ) : exercises.length === 0 ? (
        <Card className="border-dashed">
          <CardBody>
            <p className="text-fg-muted text-sm">
              No exercises yet. Hit &ldquo;Add exercise&rdquo; to start your library.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              className="group hover:border-accent-red transition-colors"
            >
              <div className="aspect-video bg-bg-raised overflow-hidden flex items-center justify-center">
                {ex.imageId ? (
                  <img
                    src={`/api/images/${ex.imageId}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Dumbbell size={48} className="text-fg-dim" />
                )}
              </div>
              <CardBody>
                <MonoLabel className="text-accent-red">
                  {DAY_NAMES[ex.dayOfWeek - 1]}
                </MonoLabel>
                <h3 className="text-xl font-semibold mt-1">{ex.name}</h3>
                <p className="text-xs text-fg-muted font-mono-label mt-1">
                  {labelMuscle(ex.muscleGroup)}
                </p>
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="font-mono-label">
                    {ex.sets} × {ex.reps}
                  </span>
                  <span className="text-fg-dim">·</span>
                  <span className="text-fg-muted">
                    {ex.weightKg > 0
                      ? formatWeight(ex.weightKg, units, { withUnit: true })
                      : "Bodyweight"}
                  </span>
                </div>
                {ex.notes && (
                  <p className="text-xs text-fg-muted mt-3 line-clamp-4">
                    {ex.notes}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(ex)}
                    className="text-fg-dim hover:text-fg"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(ex)}
                    className="text-fg-dim hover:text-accent-red"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-bg-panel border border-border rounded-lg w-full max-w-lg p-6 my-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? "Edit exercise" : "Add exercise"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-fg-dim hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-fg-dim font-mono-label">
                Name
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={form.name}
                    placeholder="e.g. Barbell Bench Press"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && aiEnabled) {
                        e.preventDefault();
                        autoFill();
                      }
                    }}
                    className="flex-1 min-w-0 bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                  />
                  {aiEnabled ? (
                    <button
                      type="button"
                      onClick={autoFill}
                      disabled={filling || form.name.trim().length < 2}
                      title="Fill the rest of this form from the name"
                      className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded border border-accent-red/60 text-accent-red text-xs font-medium hover:bg-accent-red/10 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      {filling ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      Auto-fill
                    </button>
                  ) : null}
                </div>
              </label>

              {fill ? (
                <div className="col-span-2 rounded border border-border bg-bg p-3">
                  {!fill.fill.recognized ? (
                    <p className="text-[11px] text-accent-red mb-2 font-mono-label">
                      NOT A KNOWN EXERCISE — VALUES ARE A BEST GUESS
                    </p>
                  ) : null}
                  <div className="flex gap-3">
                    <div className="w-32 shrink-0">
                      <MuscleAnatomy
                        primary={fill.fill.primaryMuscles}
                        secondary={fill.fill.secondaryMuscles}
                        showLegend={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-fg-muted leading-relaxed">
                        {fill.fill.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fill.fill.primaryMuscles.map((m) => (
                          <span
                            key={m}
                            className="text-[10px] font-mono-label px-1.5 py-0.5 rounded border border-accent-red/60 text-accent-red"
                          >
                            {MUSCLE_LABELS[m]}
                          </span>
                        ))}
                        {fill.fill.secondaryMuscles.map((m) => (
                          <span
                            key={m}
                            className="text-[10px] font-mono-label px-1.5 py-0.5 rounded border border-border text-fg-dim"
                          >
                            {MUSCLE_LABELS[m]}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-fg-dim font-mono-label mt-2">
                        {fill.fill.equipment} · {fill.fill.difficulty} ·{" "}
                        {fill.fill.restSeconds}s rest
                        {fill.cached ? " · cached" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              <label className="text-xs text-fg-dim font-mono-label">
                Muscle group
                <select
                  value={form.muscleGroup}
                  onChange={(e) =>
                    setForm({ ...form, muscleGroup: e.target.value as MuscleGroup })
                  }
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {labelMuscle(g)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Day
                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({ ...form, dayOfWeek: Number(e.target.value) })
                  }
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Sets
                <input
                  type="number"
                  value={form.sets}
                  onChange={(e) =>
                    setForm({ ...form, sets: Number(e.target.value) })
                  }
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Reps
                <input
                  type="number"
                  value={form.reps}
                  onChange={(e) =>
                    setForm({ ...form, reps: Number(e.target.value) })
                  }
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <label className="text-xs text-fg-dim font-mono-label">
                Weight ({units})
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) =>
                    setForm({ ...form, weightKg: Number(e.target.value) })
                  }
                  className="mt-1 w-full bg-bg border border-border rounded px-3 h-10 text-sm focus:outline-none focus:border-accent-red"
                />
              </label>
              <label className="col-span-2 text-xs text-fg-dim font-mono-label">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-red resize-none"
                />
              </label>
              <label className="col-span-2 text-xs text-fg-dim font-mono-label">
                Image (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, imageFile: e.target.files?.[0] ?? null })
                  }
                  className="mt-1 block text-sm text-fg-muted file:mr-3 file:py-1.5 file:px-3 file:border file:border-border file:rounded file:bg-bg file:text-fg"
                />
              </label>
            </div>
            {error && <p className="text-accent-red text-sm mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={submit}
                disabled={saving || !form.name.trim()}
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                {editing ? "Save changes" : "Add exercise"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
