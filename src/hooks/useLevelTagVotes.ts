import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LevelTagVote {
  id: string;
  level_id: string;
  level_type: "main" | "extra";
  preset_id: string;
  user_id: string;
  created_at: string;
}

export function useLevelTagVotes(levelDbId?: string | null) {
  return useQuery({
    queryKey: ["level-tag-votes", levelDbId],
    queryFn: async () => {
      if (!levelDbId) return [] as LevelTagVote[];
      const { data, error } = await supabase
        .from("level_tag_votes")
        .select("*")
        .eq("level_id", levelDbId);
      if (error) throw error;
      return (data as LevelTagVote[]) || [];
    },
    enabled: !!levelDbId,
    staleTime: 60_000,
  });
}

export function useAllLevelTagVotes() {
  return useQuery({
    queryKey: ["all-level-tag-votes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("level_tag_votes").select("*");
      if (error) throw error;
      return (data as LevelTagVote[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleTagVote(levelDbId?: string | null, levelType: "main" | "extra" = "main") {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { presetId: string; existingVoteId?: string }) => {
      if (!user || !levelDbId) throw new Error("Not signed in");
      if (input.existingVoteId) {
        const { error } = await supabase
          .from("level_tag_votes")
          .delete()
          .eq("id", input.existingVoteId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("level_tag_votes").insert({
          level_id: levelDbId,
          level_type: levelType,
          preset_id: input.presetId,
          user_id: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-tag-votes", levelDbId] });
      qc.invalidateQueries({ queryKey: ["all-level-tag-votes"] });
    },
  });
}

export function useAdminDeleteTagVote(levelDbId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voteId: string) => {
      const { error } = await supabase.from("level_tag_votes").delete().eq("id", voteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-tag-votes", levelDbId] });
      qc.invalidateQueries({ queryKey: ["all-level-tag-votes"] });
    },
  });
}
