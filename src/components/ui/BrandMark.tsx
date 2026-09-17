import { cn } from "@/lib/cn";

interface BrandMarkProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * BrandMark — the red square "FG" + optional FLEXGAIN wordmark.
 * Used in TopBar, sidebar, footer.
 */
export function BrandMark({
  size = 28,
  withWordmark = true,
  className,
}: BrandMarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="grid place-items-center rounded bg-accent-red text-white font-bold text-[11px] tracking-wider"
      >
        FG
      </span>
      {withWordmark ? (
        <span className="font-mono-label text-fg tracking-[0.2em] text-[12px]">
          FLEXGAIN
        </span>
      ) : null}
    </div>
  );
}
