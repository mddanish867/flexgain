"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { HeroIllustration } from "./HeroIllustration";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <MonoLabel className="block mb-5">
              DISCIPLINE IS A DAILY DECISION
            </MonoLabel>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
              Build the body{" "}
              <span className="text-accent-red">you came for.</span>
            </h1>
            <p className="mt-5 text-fg-muted text-base sm:text-lg max-w-xl text-pretty">
              Training, fuel and progress — one sharp view. FlexGain cuts the
              noise out of workout tracking so the only thing you have to focus
              on is the next rep.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={buttonClass({ size: "lg" })}
              >
                Start training <ArrowRight size={16} />
              </Link>
              <Link
                href="#how"
                className={buttonClass({ variant: "secondary", size: "lg" })}
              >
                See how it works
              </Link>
            </div>

            <ul className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { k: "REPS", v: "Logged in ms" },
                { k: "MACROS", v: "Tracked daily" },
                { k: "PROGRESS", v: "Real charts" },
              ].map((s) => (
                <li key={s.k} className="border-l border-border pl-3">
                  <div className="font-mono-label text-fg-dim">{s.k}</div>
                  <div className="text-sm text-fg mt-1">{s.v}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <HeroIllustration className="w-full max-w-md mx-auto" />
          </div>
        </div>
      </div>

      {/* subtle divider */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  );
}
