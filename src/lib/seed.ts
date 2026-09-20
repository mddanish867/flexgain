import { createUser, findUserByEmail, updateUser } from "./users";
import { createExercise } from "./exercises";
import { logWeight, logNutrition } from "./nutrition";
import { logMuscle } from "./muscles";
import { upsertDietPlan, newMeal } from "./diet";

/**
 * Seeds a demo user with a week of plausible data so the dashboard
 * doesn't look empty on first login.
 *
 * Idempotent — checks the `users` table for the demo email before
 * inserting anything, so it's safe to call on every request.
 * Demo credentials: demo@flexgain.app / demo1234
 */
export async function ensureSeed(): Promise<void> {
  if (process.env.FLEXGAIN_SEED === "0") return;
  const existing = await findUserByEmail("demo@flexgain.app");
  if (existing) return;

  let user;
  try {
    user = await createUser({
      email: "demo@flexgain.app",
      password: "demo1234",
      name: "Md Danish Akhtar",
    });
  } catch (err) {
    // Another instance/request seeded concurrently — nothing to do.
    if (err instanceof Error && err.message === "EMAIL_TAKEN") return;
    throw err;
  }
  await updateUser(user.id, {
    settings: {
      weightGoalKg: 60,
      calorieGoal: 2374,
      proteinGoal: 108,
      units: "kg",
    },
  });

  // Sample exercises across the week
  const samples: Array<Parameters<typeof createExercise>[1]> = [
    {
      name: "Push-ups",
      muscleGroup: "chest",
      sets: 4,
      reps: 12,
      weightKg: 0,
      dayOfWeek: 1,
      notes:
        "Set up with a stable stance and brace your core. Move slowly through the full range while keeping focus on your chest. Control the return, breathe steadily, and stop before form breaks down.",
      imageId: null,
    },
    {
      name: "Goblet Squat",
      muscleGroup: "legs",
      sets: 4,
      reps: 10,
      weightKg: 20,
      dayOfWeek: 1,
      notes:
        "Set up with a stable stance and brace your core. Move slowly through the full range while keeping focus on your legs. Control the return, breathe steadily, and stop before form breaks down.",
      imageId: null,
    },
    {
      name: "Barbell Row",
      muscleGroup: "back",
      sets: 4,
      reps: 8,
      weightKg: 40,
      dayOfWeek: 3,
      notes:
        "Set up with a stable stance and brace your core. Move slowly through the full range while keeping focus on your back. Control the return, breathe steadily, and stop before form breaks down.",
      imageId: null,
    },
    {
      name: "Shoulder Press",
      muscleGroup: "shoulders",
      sets: 3,
      reps: 10,
      weightKg: 15,
      dayOfWeek: 5,
      notes:
        "Set up with a stable stance and brace your core. Move slowly through the full range while keeping focus on your shoulders. Control the return, breathe steadily, and stop before form breaks down.",
      imageId: null,
    },
    {
      name: "Barbell Bench Press",
      muscleGroup: "chest",
      sets: 4,
      reps: 10,
      weightKg: 10,
      dayOfWeek: 1,
      notes:
        "Set up with a stable stance and brace your core. Move slowly through the full range while keeping focus on your chest. Control the return, breathe steadily, and stop before form breaks down.",
      imageId: null,
    },
  ];
  for (const s of samples) await createExercise(user.id, s);

  // Sample weights (last 14 days)
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // gentle downward trend toward 60kg goal from 55kg
    const weight = 55 - i * 0.07 + (Math.random() - 0.5) * 0.3;
    await logWeight(user.id, { date: dateStr, weightKg: Number(weight.toFixed(2)) });
  }

  // Today's nutrition + one earlier entry
  const todayStr = today.toISOString().slice(0, 10);
  await logNutrition(user.id, {
    date: todayStr,
    weightKg: 54,
    calories: 0,
    proteinG: 0,
    notes: "",
  });
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  await logNutrition(user.id, {
    date: yesterday.toISOString().slice(0, 10),
    weightKg: 54.2,
    calories: 1800,
    proteinG: 80,
    notes: "",
  });

  // Sample muscle logs for today
  for (const g of ["chest", "back", "legs", "shoulders", "arms", "core"] as const) {
    await logMuscle(user.id, {
      date: todayStr,
      muscleGroup: g,
      soreness: Math.floor(Math.random() * 7) + 2,
      trained: Math.random() > 0.5,
    });
  }

  // Sample diet plan for today
  const plan = {
    meals: [
      { ...newMeal(), name: "Oats + whey", calories: 480, proteinG: 35, carbsG: 60, fatG: 8, time: "08:00" },
      { ...newMeal(), name: "Chicken rice", calories: 720, proteinG: 55, carbsG: 80, fatG: 12, time: "13:00" },
      { ...newMeal(), name: "Protein shake", calories: 180, proteinG: 25, carbsG: 8, fatG: 3, time: "17:00" },
    ],
  };
  await upsertDietPlan(user.id, todayStr, plan.meals);
}
