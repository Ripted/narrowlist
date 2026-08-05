import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
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
  name: string | null;
  rank_position: number;
  points: number;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
}

// Merge sourceProfile into targetProfile: transfer all data, update username references, delete source
async function mergeProfiles(
  supabase: ReturnType<typeof createClient>,
  sourceProfileId: string,
  targetProfileId: string,
  newUsername: string,
  oldUsername: string
): Promise<void> {
  console.log(`Merging profile ${oldUsername} (${sourceProfileId}) -> ${newUsername} (${targetProfileId})`);

  // Transfer completions (skip duplicates by level_id)
  const { data: targetCompletions } = await supabase
    .from("completions").select("level_id").eq("profile_id", targetProfileId);
  const targetLevelIds = new Set((targetCompletions || []).map(c => c.level_id));
  const { data: sourceCompletions } = await supabase
    .from("completions").select("id, level_id").eq("profile_id", sourceProfileId);
  if (sourceCompletions) {
    for (const sc of sourceCompletions) {
      if (!targetLevelIds.has(sc.level_id)) {
        await supabase.from("completions").update({ profile_id: targetProfileId }).eq("id", sc.id);
      } else {
        await supabase.from("completions").delete().eq("id", sc.id);
      }
    }
  }

  // Transfer extra_completions (skip duplicates)
  const { data: targetExtra } = await supabase
    .from("extra_completions").select("level_id").eq("profile_id", targetProfileId);
  const targetExtraIds = new Set((targetExtra || []).map(c => c.level_id));
  const { data: sourceExtra } = await supabase
    .from("extra_completions").select("id, level_id").eq("profile_id", sourceProfileId);
  if (sourceExtra) {
    for (const se of sourceExtra) {
      if (!targetExtraIds.has(se.level_id)) {
        await supabase.from("extra_completions").update({ profile_id: targetProfileId }).eq("id", se.id);
      } else {
        await supabase.from("extra_completions").delete().eq("id", se.id);
      }
    }
  }

  // Transfer manual_runs
  const { data: targetManual } = await supabase
    .from("manual_runs").select("level_id, list_type").eq("profile_id", targetProfileId);
  const targetManualKeys = new Set((targetManual || []).map(m => `${m.level_id}:${m.list_type}`));
  const { data: sourceManual } = await supabase
    .from("manual_runs").select("id, level_id, list_type").eq("profile_id", sourceProfileId);
  if (sourceManual) {
    for (const sm of sourceManual) {
      if (!targetManualKeys.has(`${sm.level_id}:${sm.list_type}`)) {
        await supabase.from("manual_runs").update({ profile_id: targetProfileId }).eq("id", sm.id);
      } else {
        await supabase.from("manual_runs").delete().eq("id", sm.id);
      }
    }
  }

  // Transfer verifier references
  await supabase.from("levels").update({ verifier_profile_id: targetProfileId }).eq("verifier_profile_id", sourceProfileId);
  await supabase.from("extended_levels").update({ verifier_profile_id: targetProfileId }).eq("verifier_profile_id", sourceProfileId);
  await supabase.from("discord_notifications").update({ profile_id: targetProfileId }).eq("profile_id", sourceProfileId);
  await supabase.from("profile_claim_requests").update({ profile_id: targetProfileId }).eq("profile_id", sourceProfileId);

  // Update username
  await supabase.from("profiles").update({ username: newUsername }).eq("id", targetProfileId);

  // Update author/creators
  await supabase.from("levels").update({ author: newUsername }).eq("author", oldUsername);
  await supabase.from("extended_levels").update({ author: newUsername }).eq("author", oldUsername);

  const { data: levelsWithCreator } = await supabase
    .from("levels").select("id, creators").contains("creators", [oldUsername]);
  if (levelsWithCreator) {
    for (const l of levelsWithCreator) {
      const updated = (l.creators || []).map((c: string) => c === oldUsername ? newUsername : c);
      await supabase.from("levels").update({ creators: updated }).eq("id", l.id);
    }
  }
  const { data: extLevelsWithCreator } = await supabase
    .from("extended_levels").select("id, creators").contains("creators", [oldUsername]);
  if (extLevelsWithCreator) {
    for (const l of extLevelsWithCreator) {
      const updated = (l.creators || []).map((c: string) => c === oldUsername ? newUsername : c);
      await supabase.from("extended_levels").update({ creators: updated }).eq("id", l.id);
    }
  }

  // Delete source profile and remaining references
  await supabase.from("completions").delete().eq("profile_id", sourceProfileId);
  await supabase.from("extra_completions").delete().eq("profile_id", sourceProfileId);
  await supabase.from("manual_runs").delete().eq("profile_id", sourceProfileId);
  await supabase.from("discord_notifications").delete().eq("profile_id", sourceProfileId);
  await supabase.from("profile_claim_requests").delete().eq("profile_id", sourceProfileId);
  await supabase.from("profiles").delete().eq("id", sourceProfileId);

  console.log(`Merged: ${oldUsername} -> ${newUsername}, deleted source profile`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAdminOrInternal(req);
  if (authError) return authError;

  try {
    console.log("Starting sync-extra-completions...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: levels, error: levelsError } = await supabase
      .from("extended_levels")
      .select("id, level_id, name, rank_position, points, verifier_profile_id, alternative_ids")
      .order("rank_position", { ascending: true });

    if (levelsError) throw levelsError;
    if (!levels || levels.length === 0) {
      return new Response(JSON.stringify({ message: "No extended levels to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Found ${levels.length} extended levels to sync`);

    let totalNewCompletions = 0;

    for (const level of levels as ExtendedLevel[]) {
      const levelIdsToFetch = [level.level_id, ...(level.alternative_ids || [])];
      let oldestCompletion: { profile_id: string; completed_at: string } | null = null;

      for (const currentLevelId of levelIdsToFetch) {
        try {
          const response = await fetch(`${API_BASE}/leaderboard?levelId=${currentLevelId}`);
          if (!response.ok) {
            console.error(`Failed to fetch leaderboard for ${currentLevelId}: ${response.status}`);
            continue;
          }

          const leaderboard: LeaderboardEntry[] = await response.json();
          console.log(`Found ${leaderboard.length} entries for ${currentLevelId}`);

          for (const entry of leaderboard) {
            // Look up profile by current API username
            let { data: profile } = await supabase
              .from("profiles")
              .select("id, user_id, username")
              .eq("username", entry.username)
              .maybeSingle();

            if (!profile) {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({ username: entry.username, extra_points: 0 })
                .select("id, user_id, username")
                .single();

              if (createError) {
                console.error(`Error creating profile for ${entry.username}:`, createError);
                continue;
              }
              profile = newProfile;
              console.log(`Created new profile for ${entry.username}`);
            }

            // Check if this run_id already exists - use .limit() to handle duplicates safely
            const { data: existingRuns } = await supabase
              .from("extra_completions")
              .select("id, completed_at, profile_id")
              .eq("run_id", entry.run_id)
              .limit(2);

            const existingCompletion = existingRuns && existingRuns.length > 0 ? existingRuns[0] : null;

            // Handle username changes
            if (existingCompletion && existingCompletion.profile_id !== profile.id) {
              const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id, username, user_id")
                .eq("id", existingCompletion.profile_id)
                .maybeSingle();

              if (existingProfile && existingProfile.username !== entry.username) {
                const keepProfile = existingProfile.user_id ? existingProfile :
                                    profile.user_id ? profile : existingProfile;
                const deleteProfile = keepProfile.id === existingProfile.id ? profile : existingProfile;
                const oldUsername = deleteProfile.username;

                if (keepProfile.id !== deleteProfile.id) {
                  await mergeProfiles(supabase, deleteProfile.id, keepProfile.id, entry.username, oldUsername);
                  profile = { id: keepProfile.id, user_id: keepProfile.user_id, username: entry.username };
                }
              }
              continue;
            }

            // Clean up duplicate run_ids
            if (existingRuns && existingRuns.length > 1) {
              for (let i = 1; i < existingRuns.length; i++) {
                await supabase.from("extra_completions").delete().eq("id", existingRuns[i].id);
              }
            }

            // Check if completion already exists for this profile/level combo
            if (!existingCompletion) {
              const { data: existingLevelCompletion } = await supabase
                .from("extra_completions")
                .select("id, completed_at")
                .eq("profile_id", profile.id)
                .eq("level_id", level.id)
                .maybeSingle();

              if (existingLevelCompletion) {
                if (!oldestCompletion || new Date(existingLevelCompletion.completed_at) < new Date(oldestCompletion.completed_at)) {
                  oldestCompletion = { profile_id: profile.id, completed_at: existingLevelCompletion.completed_at };
                }
                continue;
              }

              // Fetch run details for completion date
              let completedAt = new Date().toISOString();
              try {
                const runResponse = await fetch(`${API_BASE}/runs/${entry.run_id}`);
                if (runResponse.ok) {
                  const runDetails = await runResponse.json();
                  if (runDetails.finishedAt) completedAt = runDetails.finishedAt;
                }
              } catch (runError) {
                console.error(`Error fetching run details for ${entry.run_id}:`, runError);
              }

              const { error: insertError } = await supabase
                .from("extra_completions")
                .insert({
                  profile_id: profile.id,
                  level_id: level.id,
                  run_id: entry.run_id,
                  completion_time: entry.completion_time,
                  arrow_name: entry.arrow_name,
                  completed_at: completedAt,
                });

              if (insertError) {
                if (insertError.code === '23505') continue;
                console.error(`Error inserting extra completion:`, insertError);
                continue;
              }

              totalNewCompletions++;
              console.log(`Added extra completion: ${entry.username} on ${level.level_id}`);

              if (!oldestCompletion || new Date(completedAt) < new Date(oldestCompletion.completed_at)) {
                oldestCompletion = { profile_id: profile.id, completed_at: completedAt };
              }
            } else {
              if (existingCompletion.completed_at) {
                if (!oldestCompletion || new Date(existingCompletion.completed_at) < new Date(oldestCompletion.completed_at)) {
                  oldestCompletion = { profile_id: profile.id, completed_at: existingCompletion.completed_at };
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error processing level ID ${currentLevelId}:`, error);
          continue;
        }
      }

      // Update verifier only if not already manually set
      if (!level.verifier_profile_id && oldestCompletion) {
        await supabase.from("extended_levels")
          .update({ verifier_profile_id: oldestCompletion.profile_id })
          .eq("id", level.id);
        console.log(`Updated verifier for ${level.level_id}`);
      }
    }

    // Recalculate all extra points
    const { error: recalcErr } = await supabase.rpc("recalculate_all_extra_points");
    if (recalcErr) console.error("recalculate_all_extra_points error:", recalcErr);
    else console.log("Recalculated extra_points for all profiles");

    console.log(`Sync complete. Added ${totalNewCompletions} new extra completions.`);

    return new Response(
      JSON.stringify({
        message: "Sync complete",
        newCompletions: totalNewCompletions,
        levelsProcessed: levels.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
