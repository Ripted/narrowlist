// Community rating-based creator points were removed.
// Creator points are now simply 1 per main-list level a creator has.

export interface CreatorPointsConfig {
  main_rating_multiplier: number;
  extra_flat_points: number;
  default_unrated_rating: number;
}

export const DEFAULT_CREATOR_CONFIG: CreatorPointsConfig = {
  main_rating_multiplier: 1,
  extra_flat_points: 0,
  default_unrated_rating: 0,
};

export function useCreatorPointsConfig() {
  return {
    data: DEFAULT_CREATOR_CONFIG,
    isLoading: false,
    error: null,
  } as { data: CreatorPointsConfig; isLoading: boolean; error: null };
}

/**
 * Creator points formula: 1 point per main-list level.
 * Extra list contributes 0.
 */
export function mainLevelCreatorPoints(
  _avgRating: number | undefined | null,
  _ratingCount: number | undefined | null,
  _config: CreatorPointsConfig
): number {
  return 1;
}
