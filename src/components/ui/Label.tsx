import * as React from "react";
import { cn } from "@/lib/cn";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, required, children, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-xs font-medium text-fg-muted mb-1.5 tracking-wide",
          className,
        )}
        {...props}
      >
        {children}
        {required ? <span className="text-accent-red ml-0.5">*</span> : null}
      </label>
    );
  },
);
