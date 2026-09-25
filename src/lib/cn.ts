import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** `clsx` + `tailwind-merge`, the usual shadcn/ui helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
