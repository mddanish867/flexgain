import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";
import { getDietPlan, listDietPlans, upsertDietPlan } from "@/lib/diet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (date) {
    const plan = getDietPlan(user.id, date);
    return NextResponse.json({ plan: plan ?? null });
  }
  return NextResponse.json({ plans: listDietPlans(user.id) });
}

const MealSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  calories: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(500),
  fatG: z.number().min(0).max(300),
  time: z.string().optional(),
});

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(MealSchema),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const plan = upsertDietPlan(user.id, parsed.data.date, parsed.data.meals);
  return NextResponse.json({ plan });
}
