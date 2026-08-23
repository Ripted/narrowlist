import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Estimated rank for future-list levels. When several levels share the same
 * estimated rank, sub_rank disambiguates them: ~#5.1, ~#5.2, ...
 */
export function formatFutureRank(rankPosition: number, subRank?: number | null, groupSize = 1) {
  if (groupSize > 1) return `~#${rankPosition}.${subRank ?? 1}`;
  return `~#${rankPosition}`;
}
