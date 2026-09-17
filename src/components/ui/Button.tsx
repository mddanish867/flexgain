import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-red text-white hover:bg-[#ff4d44] active:bg-[#e53229] border border-transparent",
  secondary:
    "bg-bg-panel text-fg border border-border hover:border-border-strong hover:bg-bg-raised",
  ghost:
    "bg-transparent text-fg-muted hover:text-fg hover:bg-bg-panel border border-transparent",
  outline:
    "bg-transparent text-fg border border-border hover:border-accent-red hover:text-accent-red",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      className,
      fullWidth,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);

/** Compose the same class set used by <Button> for non-button elements (Link, a, etc.). */
export function buttonClass(
  opts: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    className?: string;
  } = {},
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150 select-none",
    variantClasses[opts.variant ?? "primary"],
    sizeClasses[opts.size ?? "md"],
    opts.fullWidth && "w-full",
    opts.className,
  );
}
