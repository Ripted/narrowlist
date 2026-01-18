import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TagPreset {
  id: string;
  emoji: string;
  text: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useTagPresets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["tag-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tag_presets")
        .select("*")
        .order("text");

      if (error) throw error;
      return (data as TagPreset[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addPreset = useMutation({
    mutationFn: async (preset: { emoji: string; text: string; description?: string }) => {
      const { error } = await supabase.from("tag_presets").insert({
        emoji: preset.emoji || "🏷️",
        text: preset.text,
        description: preset.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-presets"] });
      toast({ title: "Success", description: "Tag preset created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; emoji?: string; text?: string; description?: string }) => {
      const { error } = await supabase
        .from("tag_presets")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-presets"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tag_presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-presets"] });
      toast({ title: "Deleted", description: "Tag preset removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    presets: query.data || [],
    isLoading: query.isLoading,
    addPreset,
    updatePreset,
    deletePreset,
  };
}
