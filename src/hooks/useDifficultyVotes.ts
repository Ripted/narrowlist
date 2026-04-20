import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DifficultyVote {
  id: string;
  level_id: string;
  level_type: "main" | "extra";
  user_id: string;
  difficulty: number;
  created_at: string;
  updated_at: string;
}

export function useDifficultyVotes(levelDbId?: string | null) {
  return useQuery({
    queryKey: ["difficulty-votes", levelDbId],
    queryFn: async () => {
      if (!levelDbId) return [] as DifficultyVote[];
      const { data, error } = await supabase
        .from("level_difficulty_votes")
        .select("*")
        .eq("level_id", levelDbId);
      if (error) throw error;
      return (data as DifficultyVote[]) || [];
    },
    enabled: !!levelDbId,
    staleTime: 60_000,
  });
}

export function useAllDifficultyVotes() {
  return useQuery({
    queryKey: ["all-difficulty-votes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("level_difficulty_votes").select("*");
      if (error) throw error;
      return (data as DifficultyVote[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitDifficulty(levelDbId?: string | null, levelType: "main" | "extra" = "main") {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; difficulty: number }) => {
      if (!user || !levelDbId) throw new Error("Not signed in");
      if (input.id) {
        const { error } = await supabase
          .from("level_difficulty_votes")
          .update({ difficulty: input.difficulty })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("level_difficulty_votes").insert({
          level_id: levelDbId,
          level_type: levelType,
          user_id: user.id,
          difficulty: input.difficulty,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulty-votes", levelDbId] });
      qc.invalidateQueries({ queryKey: ["all-difficulty-votes"] });
    },
  });
}

export function useDeleteDifficultyVote(levelDbId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voteId: string) => {
      const { error } = await supabase.from("level_difficulty_votes").delete().eq("id", voteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["difficulty-votes", levelDbId] });
      qc.invalidateQueries({ queryKey: ["all-difficulty-votes"] });
    },
  });
}

export function formatDifficulty(d: number): string {
  // D0..D8 with 0.1 increments
  return `D${d.toFixed(1)}`;
}

export function averageDifficulty(votes: DifficultyVote[]): number | null {
  if (votes.length === 0) return null;
  return votes.reduce((s, v) => s + Number(v.difficulty), 0) / votes.length;
}
