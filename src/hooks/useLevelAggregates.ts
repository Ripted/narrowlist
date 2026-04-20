import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Fetches and aggregates ALL level ratings into per-level averages.
 * Cached 5 min, used to power sorting on list pages.
 */
export function useAllRatingsAggregate() {
  return useQuery({
    queryKey: ["all-level-ratings-aggregate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("level_ratings")
        .select("level_id, enjoyment, design, decoration, gameplay");
      if (error) throw error;

      const map = new Map<string, RatingAggregate>();
      for (const r of data || []) {
        const existing = map.get(r.level_id);
        if (existing) {
          existing.count += 1;
          existing.avg_enjoyment += Number(r.enjoyment);
          existing.avg_design += Number(r.design);
          existing.avg_decoration += Number(r.decoration);
          existing.avg_gameplay += Number(r.gameplay);
        } else {
          map.set(r.level_id, {
            level_id: r.level_id,
            count: 1,
            avg_enjoyment: Number(r.enjoyment),
            avg_design: Number(r.design),
            avg_decoration: Number(r.decoration),
            avg_gameplay: Number(r.gameplay),
            avg_overall: 0,
          });
        }
      }
      // finalize averages
      for (const agg of map.values()) {
        agg.avg_enjoyment /= agg.count;
        agg.avg_design /= agg.count;
        agg.avg_decoration /= agg.count;
        agg.avg_gameplay /= agg.count;
        agg.avg_overall =
          (agg.avg_enjoyment + agg.avg_design + agg.avg_decoration + agg.avg_gameplay) / 4;
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllDifficultyAggregate() {
  return useQuery({
    queryKey: ["all-difficulty-aggregate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("level_difficulty_votes")
        .select("level_id, difficulty");
      if (error) throw error;

      const map = new Map<string, DifficultyAggregate>();
      for (const r of data || []) {
        const existing = map.get(r.level_id);
        if (existing) {
          existing.count += 1;
          existing.avg_difficulty += Number(r.difficulty);
        } else {
          map.set(r.level_id, {
            level_id: r.level_id,
            count: 1,
            avg_difficulty: Number(r.difficulty),
          });
        }
      }
      for (const agg of map.values()) {
        agg.avg_difficulty /= agg.count;
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type LevelSortKey =
  | "rank"
  | "rank_desc"
  | "name"
  | "points_desc"
  | "rating_overall"
  | "rating_enjoyment"
  | "rating_design"
  | "rating_decoration"
  | "rating_gameplay"
  | "difficulty_desc"
  | "difficulty_asc"
  | "votes";

export const SORT_OPTIONS: { value: LevelSortKey; label: string }[] = [
  { value: "rank", label: "Rank (lowest first)" },
  { value: "rank_desc", label: "Rank (highest first)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "points_desc", label: "Points (high → low)" },
  { value: "rating_overall", label: "Overall rating" },
  { value: "rating_enjoyment", label: "Enjoyment" },
  { value: "rating_design", label: "Design" },
  { value: "rating_decoration", label: "Decoration" },
  { value: "rating_gameplay", label: "Gameplay" },
  { value: "difficulty_desc", label: "Community difficulty (high → low)" },
  { value: "difficulty_asc", label: "Community difficulty (low → high)" },
  { value: "votes", label: "Most rated" },
];
