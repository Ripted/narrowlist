// Community tag feature was removed from the UI.
// Hooks return empty arrays so any remaining call sites render nothing.
// The level_tags database table remains intact.

export interface LevelTag {
  id: string;
  level_id: string;
  level_type: string;
  emoji: string;
  text: string;
  show_on_card: boolean;
  show_on_page: boolean;
  display_order: number;
}

export function useLevelTags(_levelId?: string) {
  return { data: [] as LevelTag[], isLoading: false, error: null } as const;
}

export function useAllLevelTags() {
  return { data: [] as LevelTag[], isLoading: false, error: null } as const;
}
