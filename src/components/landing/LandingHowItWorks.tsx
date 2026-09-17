import { Card, CardBody } from "@/components/ui/Card";

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    copy: "Email and a password. 30 seconds. No card, no email sequence.",
  },
  {
    n: "02",
    title: "Set your goal",
    copy: "Pick a target — cut, bulk, or maintain. FlexGain shapes your daily calorie and protein targets from there.",
  },
  {
    n: "03",
    title: "Train, log, repeat",
    copy: "Open the app at the gym. Log the set. FlexGain handles the math and the streak.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="font-mono-label text-fg-dim mb-3">HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Three steps from zero to a real streak.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="relative">
              <CardBody>
                <div className="font-mono-label text-accent-red text-[11px] tracking-[0.2em] mb-4">
                  STEP {s.n}
                </div>
                <h3 className="text-fg text-xl font-semibold mb-2">
                  {s.title}
                </h3>
                <p className="text-fg-muted text-sm leading-relaxed">{s.copy}</p>
              </CardBody>
              {/* red bottom accent on every step card */}
              <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-accent-red" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
