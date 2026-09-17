import Link from "next/link";
import { Check } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    blurb: "Get the basics. Forever.",
    cta: "Start free",
    href: "/signup",
    featured: false,
    perks: [
      "Unlimited workouts",
      "Daily nutrition log",
      "Weight chart (7-day)",
      "1 diet plan",
    ],
  },
  {
    name: "Pro",
    price: "$8",
    cadence: "/mo",
    blurb: "For people who train on a schedule.",
    cta: "Go Pro",
    href: "/signup",
    featured: true,
    perks: [
      "Everything in Free",
      "Unlimited weight history",
      "Per-muscle volume charts",
      "Custom diet targets",
      "Export CSV",
    ],
  },
  {
    name: "Coach",
    price: "$24",
    cadence: "/mo",
    blurb: "Built for trainers with clients.",
    cta: "Talk to sales",
    href: "/signup",
    featured: false,
    perks: [
      "Everything in Pro",
      "Up to 20 client seats",
      "Shared plan library",
      "Priority support",
    ],
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-16 sm:py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="font-mono-label text-fg-dim mb-3">PRICING</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Pick the plan that fits your grind.
          </h2>
          <p className="mt-3 text-fg-muted text-base">
            No yearly lock-in. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <Card
              key={t.name}
              className={cn(
                "flex flex-col",
                t.featured &&
                  "border-accent-red shadow-[0_0_0_1px_rgba(255,59,48,0.35)]",
              )}
            >
              <CardHeader
                eyebrow={t.name.toUpperCase()}
                title={
                  <span className="flex items-baseline gap-1">
                    <span>{t.price}</span>
                    {t.cadence ? (
                      <span className="text-fg-muted text-sm font-normal">
                        {t.cadence}
                      </span>
                    ) : null}
                  </span>
                }
                description={t.blurb}
              />
              <CardBody className="flex-1">
                <ul className="space-y-2.5 mb-6">
                  {t.perks.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-fg-muted"
                    >
                      <Check
                        size={16}
                        className="text-accent-red shrink-0 mt-0.5"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className={buttonClass({
                    variant: t.featured ? "primary" : "secondary",
                    size: "md",
                    fullWidth: true,
                  })}
                >
                  {t.cta}
                </Link>
              </CardBody>
              {t.featured ? (
                <Badge tone="red" className="self-start mx-5 mb-5">
                  MOST PICKED
                </Badge>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
