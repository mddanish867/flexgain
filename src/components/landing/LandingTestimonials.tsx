import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody } from "@/components/ui/Card";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Marcus Hale",
    role: "Powerlifter · 3yrs on FlexGain",
    quote:
      "I dropped two tracking apps the day I tried this. The set logger is the fastest I've ever used.",
  },
  {
    name: "Priya Mehta",
    role: "Calisthenics athlete",
    quote:
      "Finally an app that doesn't try to be Instagram. I log the set, I see the chart, I get back to work.",
  },
  {
    name: "Diego Soto",
    role: "Coach · 60+ clients",
    quote:
      "My clients' adherence went up the week they switched. The diet plan view is genuinely the cleanest I've seen.",
  },
];

export function LandingTestimonials() {
  return (
    <section
      id="testimonials"
      className="py-16 sm:py-24 border-t border-border"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="font-mono-label text-fg-dim mb-3">LOVED BY LIFTERS</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Real people. Real streaks.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex flex-col">
              <CardBody className="flex-1">
                <div className="flex gap-0.5 text-accent-red mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-fg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </CardBody>
              <div className="px-5 pb-5 pt-3 border-t border-border flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-fg-dim truncate">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
