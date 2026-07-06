import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreatorPointsConfig {
  main_rating_multiplier: number;
  extra_flat_points: number;
  default_unrated_rating: number;
}

export const DEFAULT_CREATOR_CONFIG: CreatorPointsConfig = {
  main_rating_multiplier: 1,
  extra_flat_points: 1,
  default_unrated_rating: 5,
};

export function useCreatorPointsConfig() {
  return useQuery({
    queryKey: ["creator-points-config"],
    queryFn: async (): Promise<CreatorPointsConfig> => {
      const { data, error } = await supabase
        .from("creator_points_config" as any)
        .select("main_rating_multiplier, extra_flat_points, default_unrated_rating")
        .maybeSingle();
      if (error || !data) return DEFAULT_CREATOR_CONFIG;
      return {
        main_rating_multiplier: Number((data as any).main_rating_multiplier ?? 1),
        extra_flat_points: Number((data as any).extra_flat_points ?? 1),
        default_unrated_rating: Number((data as any).default_unrated_rating ?? 5),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Compute creator points for a single main-list level.
 * If the level has no ratings, treats it as `default_unrated_rating`.
 */
export function mainLevelCreatorPoints(
  avgRating: number | undefined | null,
  ratingCount: number | undefined | null,
  config: CreatorPointsConfig
): number {
  const rating =
    ratingCount && ratingCount > 0 && typeof avgRating === "number"
      ? avgRating
      : config.default_unrated_rating;
  return rating * config.main_rating_multiplier;
}
