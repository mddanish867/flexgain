import * as React from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded bg-bg border px-3 text-sm text-fg placeholder:text-fg-dim",
          "transition-colors duration-150",
          invalid
            ? "border-accent-red focus:border-accent-red"
            : "border-border focus:border-accent-red",
          className,
        )}
        {...props}
      />
    );
  },
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded bg-bg border px-3 py-2 text-sm text-fg placeholder:text-fg-dim",
          "transition-colors duration-150 resize-none",
          invalid
            ? "border-accent-red focus:border-accent-red"
            : "border-border focus:border-accent-red",
          className,
        )}
        {...props}
      />
    );
  },
);
