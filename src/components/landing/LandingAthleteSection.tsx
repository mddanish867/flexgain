import { AthleteIllustration } from "./AthleteIllustration";
import { MonoLabel } from "@/components/ui/MonoLabel";

export function LandingAthleteSection() {
  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <MonoLabel className="block mb-4">FOR THE GRIND</MonoLabel>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Built for the people who actually{" "}
            <span className="text-accent-red">show up.</span>
          </h2>
          <p className="mt-4 text-fg-muted text-base max-w-md">
            Whether you chase a 200kg deadlift or your first muscle-up — if you
            train on a regular schedule, FlexGain is for you. No influencer
            templates. No pre-built plans from people who don&apos;t lift.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-fg-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red" />
              Lifters, calisthenics, hybrid athletes
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red" />
              No-nonsense tracking, no social feed
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red" />
              Local-first, no sync drama
            </li>
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-accent-red/5 blur-3xl rounded-full" aria-hidden />
          <AthleteIllustration className="relative w-full max-w-lg mx-auto" />
        </div>
      </div>
    </section>
  );
}
