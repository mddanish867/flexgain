import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U"
  );
}

export function Avatar({ name, className, size = "md" }: AvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-full bg-accent-red text-white grid place-items-center font-semibold",
        sizeClasses[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
