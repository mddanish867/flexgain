"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { apiPatch } from "@/lib/client";
import { formatWeight, toKg } from "@/lib/units";
import type { PublicUser } from "@/lib/types";

interface SettingsFormProps {
  user: PublicUser;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  // Held in whichever unit the user is currently reading; converted to kg
  // on save and re-rendered when they switch units.
  const [weightGoal, setWeightGoal] = useState(
    formatWeight(user.settings.weightGoalKg, user.settings.units),
  );
  const [calorieGoal, setCalorieGoal] = useState(
    String(user.settings.calorieGoal),
  );
  const [proteinGoal, setProteinGoal] = useState(
    String(user.settings.proteinGoal),
  );
  const [units, setUnits] = useState<"kg" | "lb">(user.settings.units);
  const [saving, setSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveGoals(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiPatch("/api/settings", {
        name: name.trim() || user.name,
        weightGoalKg: toKg(Number(weightGoal), units),
        calorieGoal: Number(calorieGoal),
        proteinGoal: Number(proteinGoal),
        units,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveUnits(next: "kg" | "lb") {
    if (next === units) return;
    // Re-express the goal already on screen in the new unit, so switching
    // display never silently rewrites the stored kilogram value.
    const currentGoalKg = toKg(Number(weightGoal), units);
    setUnits(next);
    if (Number.isFinite(currentGoalKg)) {
      setWeightGoal(formatWeight(currentGoalKg, next));
    }
    try {
      await apiPatch("/api/settings", { units: next });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function signOutEverywhere() {
    if (
      !confirm(
        "Sign out on every device? You'll need to sign in again everywhere.",
      )
    )
      return;
    setSigningOutAll(true);
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!res.ok) throw new Error("Could not sign out everywhere");
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
      setSigningOutAll(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          eyebrow="PROFILE"
          title="Account info"
          description="Edit your name. Email is locked to your login."
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} readOnly type="email" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          eyebrow="GOALS"
          title="Training targets"
          description="Changes will sync to all charts on the dashboard."
        />
        <CardBody>
          <form onSubmit={saveGoals} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weight">Weight goal ({units})</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min={units === "lb" ? 44 : 20}
                  max={units === "lb" ? 880 : 400}
                  step="0.1"
                  value={weightGoal}
                  onChange={(e) => setWeightGoal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calories">Calorie goal</Label>
                <Input
                  id="calories"
                  type="number"
                  inputMode="numeric"
                  min={800}
                  max={8000}
                  step="10"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein goal (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  inputMode="numeric"
                  min={20}
                  max={600}
                  step="5"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-accent-red text-xs">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save goals"}
              </Button>
              {saved ? (
                <span className="text-xs text-accent-green font-mono-label">
                  SAVED
                </span>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          eyebrow="UNITS"
          title="Display preference"
          description="Weights are stored in kg and converted for display."
        />
        <CardBody>
          <div className="inline-flex rounded border border-border overflow-hidden">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                onClick={() => saveUnits(u)}
                type="button"
                className={
                  "px-4 h-10 text-sm font-medium transition-colors " +
                  (units === u
                    ? "bg-accent-red text-white"
                    : "bg-bg text-fg-muted hover:text-fg")
                }
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="border-accent-red/30">
        <CardHeader
          eyebrow="ACCOUNT"
          title="Danger zone"
          description="Sign out on this device or everywhere, or delete your account."
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={signOut} type="button">
              Sign out
            </Button>
            <Button
              variant="outline"
              onClick={signOutEverywhere}
              type="button"
              disabled={signingOutAll}
            >
              {signingOutAll ? "Signing out…" : "Sign out everywhere"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              disabled
              className="text-fg-dim"
              title="Delete account — not implemented in demo"
            >
              Delete account
            </Button>
          </div>
        </CardBody>
        <MonoLabel className="block px-5 pb-4">
          DELETE IS A FUTURE FEATURE
        </MonoLabel>
      </Card>
    </div>
  );
}
