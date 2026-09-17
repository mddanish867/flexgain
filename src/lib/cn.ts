import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — conditional class helper using clsx + tailwind-merge.
 * tailwind-merge ensures later classes win over earlier conflicting ones.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
