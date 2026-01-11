import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useLevelTags(levelId?: string) {
  return useQuery({
    queryKey: ["level-tags", levelId],
    queryFn: async () => {
      if (!levelId) return [];
      
      const { data, error } = await supabase
        .from("level_tags")
        .select("*")
        .eq("level_id", levelId)
        .order("display_order");
      
      if (error) throw error;
      return (data as LevelTag[]) || [];
    },
    enabled: !!levelId,
  });
}

export function useAllLevelTags() {
  return useQuery({
    queryKey: ["all-level-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("level_tags")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return (data as LevelTag[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
