import * as React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render a red bottom-border accent (used on dashboard section headers). */
  accent?: boolean;
  as?: "div" | "section" | "article";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { accent, className, children, as = "div", ...props },
  ref,
) {
  const Comp = as as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(
        "rounded-lg bg-bg-panel border border-border relative overflow-hidden",
        accent &&
          "after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-accent-red",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function CardHeader({
  eyebrow,
  title,
  description,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)} {...props}>
      {eyebrow ? (
        <div className="font-mono-label text-fg-dim mb-2">{eyebrow}</div>
      ) : null}
      {title ? (
        <h3 className="text-fg text-lg font-semibold leading-tight">{title}</h3>
      ) : null}
      {description ? (
        <p className="text-fg-muted text-sm mt-1">{description}</p>
      ) : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-t border-border text-fg-muted text-sm",
        className,
      )}
      {...props}
    />
  );
}
