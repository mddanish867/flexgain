import { cn } from "@/lib/cn";

interface BigStatProps {
  /** Small mono caps label, e.g. "CURRENT WEIGHT" */
  label: string;
  /** Big number — sans-serif, dominant */
  value: React.ReactNode;
  /** Right-aligned unit, e.g. "kg" */
  unit?: React.ReactNode;
  /** Sub-line under the big number (delta vs goal, etc.) */
  delta?: React.ReactNode;
  tone?: "default" | "red" | "green";
  className?: string;
}

const toneClasses = {
  default: "text-fg",
  red: "text-accent-red",
  green: "text-accent-green",
};

/** BigStat — used on dashboard cards (Current Weight, Calorie Target, etc.). */
export function BigStat({
  label,
  value,
  unit,
  delta,
  tone = "default",
  className,
}: BigStatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono-label text-fg-dim">{label}</span>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-semibold leading-none tracking-tight",
            toneClasses[tone],
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-fg-muted text-sm">{unit}</span> : null}
      </div>
      {delta ? (
        <span className="text-xs text-fg-muted">{delta}</span>
      ) : null}
    </div>
  );
}
