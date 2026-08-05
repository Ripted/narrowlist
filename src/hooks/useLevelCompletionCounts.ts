import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Aggregates completion counts (victors) per level from completions, manual_runs,
 * extra_completions, and extra manual runs. Deduplicated per (profile_id, level_id).
 */
async function fetchCounts(): Promise<Map<string, number>> {
  const PAGE_SIZE = 1000;

  const fetchAll = async (
    table: "completions" | "manual_runs_public" | "extra_completions",
    listType?: "main" | "extra"
  ): Promise<{ profile_id: string; level_id: string }[]> => {
    const all: { profile_id: string; level_id: string }[] = [];
    let from = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const baseQuery: any = (supabase.from as any)(table).select("profile_id, level_id");
      const query = listType && table === "manual_runs_public" ? baseQuery.eq("list_type", listType) : baseQuery;
      const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error || !data || data.length === 0) break;
      all.push(...(data as { profile_id: string; level_id: string }[]));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return all;
  };

  const [completions, mainManual, extraComps, extraManual] = await Promise.all([
    fetchAll("completions"),
    fetchAll("manual_runs_public", "main"),
    fetchAll("extra_completions"),
    fetchAll("manual_runs_public", "extra"),
  ]);

  // Deduplicate per (profile_id, level_id) across sources
  const seen = new Set<string>();
  const counts = new Map<string, number>();

  const add = (rows: { profile_id: string; level_id: string }[]) => {
    for (const r of rows) {
      if (!r.profile_id || !r.level_id) continue;
      const key = `${r.profile_id}:${r.level_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(r.level_id, (counts.get(r.level_id) || 0) + 1);
    }
  };

  add(completions);
  add(mainManual);
  add(extraComps);
  add(extraManual);

  return counts;
}

export function useLevelCompletionCounts() {
  return useQuery({
    queryKey: ["level-completion-counts"],
    queryFn: fetchCounts,
    staleTime: 5 * 60 * 1000,
  });
}
