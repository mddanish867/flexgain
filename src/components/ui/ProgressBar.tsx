import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number; // 0..1 or 0..100 — normalized below
  className?: string;
  tone?: "green" | "red";
  showLabel?: boolean;
}

/** ProgressBar — slim horizontal bar used for calorie/protein/workout completion. */
export function ProgressBar({
  value,
  className,
  tone = "green",
  showLabel,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value > 1 ? value : value * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full rounded bg-bg-raised border border-border overflow-hidden">
        <div
          className={cn(
            "h-full transition-[width] duration-500 ease-out",
            tone === "green" ? "bg-accent-green" : "bg-accent-red",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <div className="mt-1 text-[11px] text-fg-dim font-mono-label">
          {Math.round(pct)}%
        </div>
      ) : null}
    </div>
  );
}
