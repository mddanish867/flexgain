/**
 * HeroIllustration — a smaller decorative barbell used in the hero section.
 */
import { BarbellIllustration } from "./BarbellIllustration";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative">
        {/* glow */}
        <div className="absolute -inset-6 bg-accent-red/10 blur-3xl rounded-full" aria-hidden />
        <BarbellIllustration className="relative w-full h-auto" />
      </div>
    </div>
  );
}
