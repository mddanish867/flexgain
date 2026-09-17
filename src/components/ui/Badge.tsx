import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "red" | "green" | "outline";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-bg-raised text-fg-muted border border-border",
  red: "bg-accent-red/15 text-accent-red border border-accent-red/30",
  green: "bg-accent-green/15 text-accent-green border border-accent-green/30",
  outline: "bg-transparent text-fg-muted border border-border",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
