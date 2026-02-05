import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUserCompletions() {
  const { user } = useAuth();
  const [completedLevelIds, setCompletedLevelIds] = useState<Set<string>>(new Set());
  const [completedExtraLevelIds, setCompletedExtraLevelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompletions() {
      if (!user) {
        setCompletedLevelIds(new Set());
        setCompletedExtraLevelIds(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);

      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setCompletedLevelIds(new Set());
        setCompletedExtraLevelIds(new Set());
        setLoading(false);
        return;
      }

      // Get all main level mappings (UUID -> string level_id)
      const { data: levels } = await supabase
        .from("levels")
        .select("id, level_id");

      const levelIdMap = new Map<string, string>();
      if (levels) {
        for (const level of levels) {
          levelIdMap.set(level.id, level.level_id);
        }
      }

      // Get all extra level mappings (UUID -> string level_id)
      const { data: extraLevels } = await supabase
        .from("extended_levels")
        .select("id, level_id");

      const extraLevelIdMap = new Map<string, string>();
      if (extraLevels) {
        for (const level of extraLevels) {
          extraLevelIdMap.set(level.id, level.level_id);
        }
      }

      // Get user's completions from the completions table
      const { data: completions } = await supabase
        .from("completions")
        .select("level_id")
        .eq("profile_id", profile.id);

      // Get user's manual runs
      const { data: manualRuns } = await supabase
        .from("manual_runs")
        .select("level_id")
        .eq("profile_id", profile.id);

      // Get user's extra completions
      const { data: extraCompletions } = await supabase
        .from("extra_completions")
        .select("level_id")
        .eq("profile_id", profile.id);

      const completedIds = new Set<string>();
      
      // Add completion level_ids (these are UUIDs, need to map to string level_id)
      if (completions) {
        for (const c of completions) {
          const stringLevelId = levelIdMap.get(c.level_id);
          if (stringLevelId) {
            completedIds.add(stringLevelId);
          }
        }
      }

      // Add manual run level_ids (also UUIDs)
      if (manualRuns) {
        for (const r of manualRuns) {
          const stringLevelId = levelIdMap.get(r.level_id);
          if (stringLevelId) {
            completedIds.add(stringLevelId);
          }
        }
      }

      // Build extra completed IDs set
      const completedExtraIds = new Set<string>();
      if (extraCompletions) {
        for (const c of extraCompletions) {
          const stringLevelId = extraLevelIdMap.get(c.level_id);
          if (stringLevelId) {
            completedExtraIds.add(stringLevelId);
          }
        }
      }

      setCompletedLevelIds(completedIds);
      setCompletedExtraLevelIds(completedExtraIds);
      setLoading(false);
    }

    loadCompletions();
  }, [user]);

  return { completedLevelIds, completedExtraLevelIds, loading, isLoggedIn: !!user };
}
