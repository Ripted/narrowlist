import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const API_BASE = "https://api.narrowarrow.xyz";

interface LeaderboardEntry {
  run_id: number;
  completion_time: number;
  username: string;
  arrow_name: string;
}

interface ExtendedLevel {
  id: string;
  level_id: string;
  alternative_ids: string[] | null;
}

/**
 * Admin-only hardfix edge function
 * 1. Syncs extra completions from API → extra_completions table
 * 2. Recalculates extra_points for all profiles
 * 3. Deletes duplicate/empty unclaimed profiles
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAdminOrInternal(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Starting hardfix-resync...");

    // Step 1 - Sync extra completions
    const { data: extendedLevels, error: elErr } = await supabase
      .from("extended_levels")
      .select("id, level_id, alternative_ids")
      .order("rank_position");

    if (elErr) throw elErr;

    let newExtraCompletions = 0;

    for (const level of (extendedLevels || []) as ExtendedLevel[]) {
      const levelIds = [level.level_id, ...(level.alternative_ids || [])];

      for (const currentLevelId of levelIds) {
        try {
          const res = await fetch(
            `${API_BASE}/leaderboard?levelId=${currentLevelId}`
          );
          if (!res.ok) continue;

          const leaderboard: LeaderboardEntry[] = await res.json();

          for (const entry of leaderboard) {
            // Get or create profile
            let { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("username", entry.username)
              .maybeSingle();

            if (!profile) {
              const { data: newP, error: pErr } = await supabase
                .from("profiles")
                .insert({ username: entry.username, extra_points: 0 })
                .select("id")
                .single();
              if (pErr) continue;
              profile = newP;
            }

            // Check existing by run_id OR by profile+level combo
            const { data: existByRun } = await supabase
              .from("extra_completions")
              .select("id")
              .eq("run_id", entry.run_id)
              .maybeSingle();

            if (existByRun) continue;

            const { data: existByPL } = await supabase
              .from("extra_completions")
              .select("id")
              .eq("profile_id", profile.id)
              .eq("level_id", level.id)
              .maybeSingle();

            if (existByPL) continue;

            // Fetch run date
            let completedAt = new Date().toISOString();
            try {
              const runRes = await fetch(`${API_BASE}/runs/${entry.run_id}`);
              if (runRes.ok) {
                const rd = await runRes.json();
                if (rd.finishedAt) completedAt = rd.finishedAt;
              }
            } catch {}

            const { error: insErr } = await supabase
              .from("extra_completions")
              .insert({
                profile_id: profile.id,
                level_id: level.id,
                run_id: entry.run_id,
                completion_time: entry.completion_time,
                arrow_name: entry.arrow_name,
                completed_at: completedAt,
              });

            if (!insErr) newExtraCompletions++;
          }
        } catch (e) {
          console.error(`Error fetching leaderboard for ${currentLevelId}:`, e);
        }
      }
    }

    console.log(`Synced ${newExtraCompletions} new extra completions`);

    // Step 2 - Recalculate all extra points
    const { error: recalcErr } = await supabase.rpc(
      "recalculate_all_extra_points"
    );
    if (recalcErr) {
      console.error("recalculate_all_extra_points error:", recalcErr);
    } else {
      console.log("Recalculated extra points for all profiles");
    }

    // Step 3 - Cleanup empty unclaimed profiles
    const { data: deletedCount, error: cleanupErr } = await supabase.rpc(
      "cleanup_empty_unclaimed_profiles"
    );
    if (cleanupErr) {
      console.error("cleanup_empty_unclaimed_profiles error:", cleanupErr);
    } else {
      console.log(`Deleted ${deletedCount} duplicate/empty profiles`);
    }

    return new Response(
      JSON.stringify({
        message: "Hardfix complete",
        newExtraCompletions,
        deletedEmptyProfiles: deletedCount ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Hardfix error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
