import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { updateUser } from "@/lib/users";
import { DEFAULT_SETTINGS } from "@/lib/users";
import type { UserSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: user.settings });
}

const PatchBody = z.object({
  name: z.string().min(1).max(100).optional(),
  weightGoalKg: z.number().min(20).max(400).optional(),
  calorieGoal: z.number().min(800).max(8000).optional(),
  proteinGoal: z.number().min(20).max(600).optional(),
  units: z.enum(["kg", "lb"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (
    parsed.data.weightGoalKg !== undefined ||
    parsed.data.calorieGoal !== undefined ||
    parsed.data.proteinGoal !== undefined ||
    parsed.data.units !== undefined
  ) {
    const nextSettings: UserSettings = {
      weightGoalKg:
        parsed.data.weightGoalKg ?? user.settings.weightGoalKg ?? DEFAULT_SETTINGS.weightGoalKg,
      calorieGoal:
        parsed.data.calorieGoal ?? user.settings.calorieGoal ?? DEFAULT_SETTINGS.calorieGoal,
      proteinGoal:
        parsed.data.proteinGoal ?? user.settings.proteinGoal ?? DEFAULT_SETTINGS.proteinGoal,
      units: parsed.data.units ?? user.settings.units ?? DEFAULT_SETTINGS.units,
    };
    patch.settings = nextSettings;
  }

  const updated = updateUser(user.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ settings: updated.settings, name: updated.name });
}
