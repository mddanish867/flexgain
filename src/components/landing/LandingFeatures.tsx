import {
  Dumbbell,
  Salad,
  LineChart,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Dumbbell,
    eyebrow: "TRACK WORKOUTS",
    title: "Log every set, fast.",
    description:
      "Tap to log weight and reps. Switch between dumbbell, barbell, machine, bodyweight — your previous best is one tap away.",
  },
  {
    icon: Salad,
    eyebrow: "LOG NUTRITION",
    title: "Hit your macros without the math.",
    description:
      "Search a million foods or scan a barcode. Calories, protein, carbs, fats — all tracked against today's target.",
  },
  {
    icon: LineChart,
    eyebrow: "MONITOR PROGRESS",
    title: "Charts that tell the truth.",
    description:
      "Weight trend, volume per muscle, PR timeline. No vanity metrics. Just the numbers that move the needle.",
  },
  {
    icon: UtensilsCrossed,
    eyebrow: "PLAN DIET",
    title: "Diets built for your goal.",
    description:
      "Cut, lean bulk, maintenance. Pick a target and FlexGain shapes your daily calorie and protein around it.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="font-mono-label text-fg-dim mb-3">
            EVERYTHING YOU NEED · NOTHING YOU DON&apos;T
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Four sharp tools. One training partner.
          </h2>
          <p className="mt-3 text-fg-muted text-base">
            FlexGain is the stack you&apos;d build if you had a week off — workouts,
            food, trends, and a diet plan that respects your goal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.eyebrow} className="flex flex-col">
                <CardHeader eyebrow={f.eyebrow} title={f.title} />
                <CardBody className="flex-1">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded bg-accent-red/10 text-accent-red border border-accent-red/20">
                    <Icon size={18} />
                  </div>
                  <p className="text-fg-muted text-sm leading-relaxed">
                    {f.description}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
