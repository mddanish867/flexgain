import { cn } from "@/lib/cn";

interface MonoLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p";
}

/** MonoLabel — small caps tracking-wider eyebrow used for section headers. */
export function MonoLabel({ children, className, as = "span" }: MonoLabelProps) {
  const Comp = as;
  return (
    <Comp
      className={cn(
        "font-mono-label text-[11px] text-fg-dim uppercase tracking-[0.14em]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
