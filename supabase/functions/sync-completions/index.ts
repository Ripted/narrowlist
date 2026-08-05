import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal } from "../_shared/auth.ts";
import { isValidUsername, isValidCompletionTime, isValidName, isValidHttpUrl, sanitizeText } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const API_BASE = "https://api.narrowarrow.xyz";

// Discord notification now delegated to discord-notify edge function

const ARROW_EMOJIS: Record<string, string> = {
  'narrow': '<:narrow:1454615571730534400>',
  'narrow arrow': '<:narrow:1454615571730534400>',
  'speedy': '<:speedy:1454615488544899326>',
  'speedy arrow': '<:speedy:1454615488544899326>',
  'energy': '<:energy:1454615450393510050>',
  'energy arrow': '<:energy:1454615450393510050>',
};

function formatTime(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

function getArrowEmoji(arrowName: string | null): string {
  if (!arrowName) return '';
  const normalized = arrowName.toLowerCase().trim();
  return ARROW_EMOJIS[normalized] || '';
}

interface LeaderboardEntry {
  run_id: number;
  completion_time: number;
  username: string;
  arrow_name: string;
}

interface DbLevel {
  id: string;
  level_id: string;
  name: string | null;
  points: number;
  rank_position: number;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
}

interface NewCompletion {
  profile_id: string;
  username: string;
  level_db_id: string;
  level_name: string | null;
  level_rank: number;
  completion_time: number;
  arrow_name: string;
  run_id: number;
  is_verifier: boolean;
}

async function sendDiscordNotification(
  supabaseUrl: string,
  supabaseKey: string,
  completion: NewCompletion
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine webhook type based on rank
    const webhookType = completion.level_rank <= 100 ? 'main_completions' : 'extended_completions';

    // Delegate to discord-notify edge function
    await supabase.functions.invoke('discord-notify', {
      headers: { 'x-internal-secret': Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '' },
      body: {
        webhook_type: webhookType,
        completion_type: webhookType,
        completion_id: String(completion.run_id),
        profile_id: completion.profile_id,
        level_id: completion.level_db_id,
        player_name: completion.username,
        level_name: completion.level_name,
        level_rank: completion.level_rank,
        completion_time: completion.completion_time,
        arrow_name: completion.arrow_name,
        is_verifier: completion.is_verifier,
      },
    });
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
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
    .from("completions")
    .select("level_id")
    .eq("profile_id", targetProfileId);
  const targetLevelIds = new Set((targetCompletions || []).map(c => c.level_id));

  const { data: sourceCompletions } = await supabase
    .from("completions")
    .select("id, level_id")
    .eq("profile_id", sourceProfileId);

  if (sourceCompletions) {
    for (const sc of sourceCompletions) {
      if (!targetLevelIds.has(sc.level_id)) {
        await supabase.from("completions").update({ profile_id: targetProfileId }).eq("id", sc.id);
      } else {
        await supabase.from("completions").delete().eq("id", sc.id);
      }
    }
  }

  // Transfer extra_completions (skip duplicates by level_id)
  const { data: targetExtra } = await supabase
    .from("extra_completions")
    .select("level_id")
    .eq("profile_id", targetProfileId);
  const targetExtraIds = new Set((targetExtra || []).map(c => c.level_id));

  const { data: sourceExtra } = await supabase
    .from("extra_completions")
    .select("id, level_id")
    .eq("profile_id", sourceProfileId);

  if (sourceExtra) {
    for (const se of sourceExtra) {
      if (!targetExtraIds.has(se.level_id)) {
        await supabase.from("extra_completions").update({ profile_id: targetProfileId }).eq("id", se.id);
      } else {
        await supabase.from("extra_completions").delete().eq("id", se.id);
      }
    }
  }

  // Transfer manual_runs (skip duplicates by level_id+list_type)
  const { data: targetManual } = await supabase
    .from("manual_runs")
    .select("level_id, list_type")
    .eq("profile_id", targetProfileId);
  const targetManualKeys = new Set((targetManual || []).map(m => `${m.level_id}:${m.list_type}`));

  const { data: sourceManual } = await supabase
    .from("manual_runs")
    .select("id, level_id, list_type")
    .eq("profile_id", sourceProfileId);

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

  // Transfer discord notifications
  await supabase.from("discord_notifications").update({ profile_id: targetProfileId }).eq("profile_id", sourceProfileId);

  // Transfer claim requests
  await supabase.from("profile_claim_requests").update({ profile_id: targetProfileId }).eq("profile_id", sourceProfileId);

  // Update username on target profile
  await supabase.from("profiles").update({ username: newUsername }).eq("id", targetProfileId);

  // Update author/creators fields on levels
  await supabase.from("levels").update({ author: newUsername }).eq("author", oldUsername);
  await supabase.from("extended_levels").update({ author: newUsername }).eq("author", oldUsername);

  // Note: array_replace for creators is not available via the JS client,
  // so we fetch and update manually
  const { data: levelsWithCreator } = await supabase
    .from("levels")
    .select("id, creators")
    .contains("creators", [oldUsername]);
  if (levelsWithCreator) {
    for (const l of levelsWithCreator) {
      const updated = (l.creators || []).map((c: string) => c === oldUsername ? newUsername : c);
      await supabase.from("levels").update({ creators: updated }).eq("id", l.id);
    }
  }
  const { data: extLevelsWithCreator } = await supabase
    .from("extended_levels")
    .select("id, creators")
    .contains("creators", [oldUsername]);
  if (extLevelsWithCreator) {
    for (const l of extLevelsWithCreator) {
      const updated = (l.creators || []).map((c: string) => c === oldUsername ? newUsername : c);
      await supabase.from("extended_levels").update({ creators: updated }).eq("id", l.id);
    }
  }

  // Delete source profile
  // First clean up any remaining references
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
    console.log("Starting sync-completions...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: levels, error: levelsError } = await supabase
      .from("levels")
      .select("id, level_id, name, points, rank_position, verifier_profile_id, alternative_ids")
      .order("rank_position", { ascending: true });

    if (levelsError) throw levelsError;
    if (!levels || levels.length === 0) {
      return new Response(JSON.stringify({ message: "No levels to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Found ${levels.length} levels to sync`);

    let totalNewCompletions = 0;
    const newCompletions: NewCompletion[] = [];

    for (const level of levels as DbLevel[]) {
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
            // Reject malformed entries from the external API
            if (!isValidUsername(entry.username) || !isValidCompletionTime(entry.completion_time)) {
              console.warn("Skipping invalid leaderboard entry", entry?.run_id);
              continue;
            }
            entry.username = entry.username.trim();
            entry.arrow_name = sanitizeText(entry.arrow_name, 50) ?? "";

            // Look up profile by current API username
            let { data: profile } = await supabase
              .from("profiles")
              .select("id, user_id, username")
              .eq("username", entry.username)
              .maybeSingle();

            if (!profile) {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({ username: entry.username })
                .select("id, user_id, username")
                .single();

              if (createError) {
                console.error(`Error creating profile for ${entry.username}:`, createError);
                continue;
              }
              profile = newProfile;
              console.log(`Created new profile for ${entry.username}`);
            }

            // Check if this run_id already exists - use .limit(1) to handle duplicates safely
            const { data: existingRuns } = await supabase
              .from("completions")
              .select("id, completed_at, profile_id")
              .eq("run_id", entry.run_id)
              .limit(1);

            const existingCompletion = existingRuns && existingRuns.length > 0 ? existingRuns[0] : null;

            // Handle username changes: run exists but under a different profile
            if (existingCompletion && existingCompletion.profile_id !== profile.id) {
              const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id, username, user_id")
                .eq("id", existingCompletion.profile_id)
                .maybeSingle();

              if (existingProfile && existingProfile.username !== entry.username) {
                // Username changed! Determine which profile to keep.
                // Keep the one with user_id (claimed), or the one with more data
                const keepProfile = existingProfile.user_id ? existingProfile : 
                                    profile.user_id ? profile : existingProfile;
                const deleteProfile = keepProfile.id === existingProfile.id ? profile : existingProfile;
                const oldUsername = deleteProfile.username;

                if (keepProfile.id !== deleteProfile.id) {
                  await mergeProfiles(supabase, deleteProfile.id, keepProfile.id, entry.username, oldUsername);
                  // Update our reference to point to the kept profile
                  profile = { id: keepProfile.id, user_id: keepProfile.user_id, username: entry.username };
                }
              }
              continue;
            }

            // Also clean up duplicate run_ids (same run_id, multiple rows)
            if (existingRuns && existingRuns.length > 1) {
              // Keep only the first, delete the rest
              for (let i = 1; i < existingRuns.length; i++) {
                await supabase.from("completions").delete().eq("id", existingRuns[i].id);
              }
            }

            if (!existingCompletion) {
              // Check if profile already has a completion for this level
              const { data: existingLevelCompletion } = await supabase
                .from("completions")
                .select("id")
                .eq("profile_id", profile.id)
                .eq("level_id", level.id)
                .maybeSingle();

              if (existingLevelCompletion) continue;

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
                .from("completions")
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
                console.error(`Error inserting completion:`, insertError);
                continue;
              }

              totalNewCompletions++;
              console.log(`Added completion: ${entry.username} on ${level.level_id}`);

              const { data: existingCompletions } = await supabase
                .from("completions")
                .select("id")
                .eq("level_id", level.id)
                .limit(2);

              const { data: manualVerifierRun } = await supabase
                .from("manual_runs")
                .select("id")
                .eq("level_id", level.id)
                .eq("is_verifier", true)
                .limit(1);

              const isVerifier = !manualVerifierRun?.length && (!existingCompletions || existingCompletions.length === 1);

              newCompletions.push({
                profile_id: profile.id,
                username: entry.username,
                level_db_id: level.id,
                level_name: level.name,
                level_rank: level.rank_position,
                completion_time: entry.completion_time,
                arrow_name: entry.arrow_name,
                run_id: entry.run_id,
                is_verifier: isVerifier,
              });

              // Track oldest completion
              if (!oldestCompletion || new Date(completedAt) < new Date(oldestCompletion.completed_at)) {
                oldestCompletion = { profile_id: profile.id, completed_at: completedAt };
              }
            } else {
              // Existing completion - track for verifier
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
      if (!level.verifier_profile_id) {
        const { data: manualVerifier } = await supabase
          .from("manual_runs")
          .select("profile_id")
          .eq("level_id", level.id)
          .eq("is_verifier", true)
          .limit(1)
          .maybeSingle();

        const verifierProfileId = manualVerifier?.profile_id || oldestCompletion?.profile_id || null;

        if (verifierProfileId) {
          await supabase.from("levels").update({ verifier_profile_id: verifierProfileId }).eq("id", level.id);
          console.log(`Updated verifier for ${level.level_id}`);
        }
      }
    }

    // Recalculate points for all profiles using DB function
    const { data: profiles } = await supabase.from("profiles").select("id");
    if (profiles) {
      for (const profile of profiles) {
        await supabase.rpc("recalculate_player_points", { player_profile_id: profile.id });
      }
    }

    // Send Discord notifications
    console.log(`Sending ${newCompletions.length} Discord notifications...`);
    for (const completion of newCompletions) {
      await sendDiscordNotification(supabaseUrl, supabaseKey, completion);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Sync complete. Added ${totalNewCompletions} new completions.`);

    return new Response(
      JSON.stringify({
        message: "Sync complete",
        newCompletions: totalNewCompletions,
        levelsProcessed: levels.length,
        discordNotificationsSent: newCompletions.length,
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
