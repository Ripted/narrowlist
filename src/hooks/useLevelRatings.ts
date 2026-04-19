import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RatingCategory = "enjoyment" | "design" | "decoration" | "gameplay";

export interface LevelRating {
  id: string;
  level_id: string;
  level_type: "main" | "extra";
  user_id: string;
  enjoyment: number;
  design: number;
  decoration: number;
  gameplay: number;
  created_at: string;
  updated_at: string;
}

export interface RatingAverages {
  enjoyment: number;
  design: number;
  decoration: number;
  gameplay: number;
  overall: number;
  count: number;
}

export function computeAverages(ratings: LevelRating[]): RatingAverages {
  if (ratings.length === 0) {
    return { enjoyment: 0, design: 0, decoration: 0, gameplay: 0, overall: 0, count: 0 };
  }
  const sum = ratings.reduce(
    (acc, r) => ({
      enjoyment: acc.enjoyment + r.enjoyment,
      design: acc.design + r.design,
      decoration: acc.decoration + r.decoration,
      gameplay: acc.gameplay + r.gameplay,
    }),
    { enjoyment: 0, design: 0, decoration: 0, gameplay: 0 }
  );
  const n = ratings.length;
  const enjoyment = sum.enjoyment / n;
  const design = sum.design / n;
  const decoration = sum.decoration / n;
  const gameplay = sum.gameplay / n;
  const overall = (enjoyment + design + decoration + gameplay) / 4;
  return { enjoyment, design, decoration, gameplay, overall, count: n };
}

export function useLevelRatings(levelDbId?: string | null) {
  return useQuery({
    queryKey: ["level-ratings", levelDbId],
    queryFn: async () => {
      if (!levelDbId) return [] as LevelRating[];
      const { data, error } = await supabase
        .from("level_ratings")
        .select("*")
        .eq("level_id", levelDbId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as LevelRating[]) || [];
    },
    enabled: !!levelDbId,
    staleTime: 60_000,
  });
}

export function useUserCanRateLevel(levelDbId?: string | null, levelType: "main" | "extra" = "main") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can-rate", levelDbId, levelType, user?.id],
    queryFn: async () => {
      if (!user || !levelDbId) return false;
      const { data, error } = await supabase.rpc("user_has_completed_level", {
        _user_id: user.id,
        _level_id: levelDbId,
        _level_type: levelType,
      });
      if (error) {
        console.error("can-rate check failed", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user && !!levelDbId,
    staleTime: 60_000,
  });
}

export function useSubmitRating(levelDbId?: string | null, levelType: "main" | "extra" = "main") {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; enjoyment: number; design: number; decoration: number; gameplay: number }) => {
      if (!user || !levelDbId) throw new Error("Not signed in");
      if (input.id) {
        const { error } = await supabase
          .from("level_ratings")
          .update({
            enjoyment: input.enjoyment,
            design: input.design,
            decoration: input.decoration,
            gameplay: input.gameplay,
          })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("level_ratings").insert({
          level_id: levelDbId,
          level_type: levelType,
          user_id: user.id,
          enjoyment: input.enjoyment,
          design: input.design,
          decoration: input.decoration,
          gameplay: input.gameplay,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-ratings", levelDbId] });
    },
  });
}

export function useDeleteRating(levelDbId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase.from("level_ratings").delete().eq("id", ratingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-ratings", levelDbId] });
    },
  });
}
