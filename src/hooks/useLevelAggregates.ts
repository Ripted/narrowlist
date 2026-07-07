import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Community rating & difficulty features were removed from the UI.
// These hooks now always return empty maps so downstream displays hide themselves,
// while the underlying database tables (level_ratings, level_difficulty_votes) remain intact.

export interface RatingAggregate {
  level_id: string;
  count: number;
  avg_enjoyment: number;
  avg_design: number;
  avg_decoration: number;
  avg_gameplay: number;
  avg_overall: number;
}

export interface DifficultyAggregate {
  level_id: string;
  count: number;
  avg_difficulty: number;
}

export function useAllRatingsAggregate() {
  return useQuery({
    queryKey: ["all-level-ratings-aggregate-disabled"],
    queryFn: async () => new Map<string, RatingAggregate>(),
    staleTime: Infinity,
  });
}

export function useAllDifficultyAggregate() {
  return useQuery({
    queryKey: ["all-difficulty-aggregate-disabled"],
    queryFn: async () => new Map<string, DifficultyAggregate>(),
    staleTime: Infinity,
  });
}

// Keep supabase import referenced (silences unused warnings in some setups).
void supabase;

export type LevelSortField =
  | "rank"
  | "name"
  | "points"
  | "votes"
  | "completions";

export type SortDirection = "asc" | "desc";

export const SORT_FIELD_OPTIONS: { value: LevelSortField; label: string }[] = [
  { value: "rank", label: "Rank" },
  { value: "name", label: "Name" },
  { value: "points", label: "Points" },
  { value: "completions", label: "Most completions" },
];

export const DEFAULT_SORT_DIRECTION: Record<LevelSortField, SortDirection> = {
  rank: "asc",
  name: "asc",
  points: "desc",
  votes: "desc",
  completions: "desc",
};
