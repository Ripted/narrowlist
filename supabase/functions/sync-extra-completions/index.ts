import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sync-extra-completions...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all extended levels from database
    const { data: levels, error: levelsError } = await supabase
      .from("extended_levels")
      .select("id, level_id, name, rank_position, points, verifier_profile_id, alternative_ids")
      .order("rank_position", { ascending: true });

    if (levelsError) {
      console.error("Error fetching extended levels:", levelsError);
      throw levelsError;
    }

    if (!levels || levels.length === 0) {
      console.log("No extended levels found");
      return new Response(
        JSON.stringify({ message: "No extended levels to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${levels.length} extended levels to sync`);

    let totalNewCompletions = 0;

    for (const level of levels as ExtendedLevel[]) {
      console.log(`Processing extended level: ${level.level_id}`);

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
            // Get or create profile
            let { data: profile } = await supabase
              .from("profiles")
              .select("id, user_id")
              .eq("username", entry.username)
              .maybeSingle();

            if (!profile) {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({ username: entry.username, extra_points: 0 })
                .select("id, user_id")
                .single();

              if (createError) {
                console.error(`Error creating profile for ${entry.username}:`, createError);
                continue;
              }
              profile = newProfile;
              console.log(`Created new profile for ${entry.username}`);
            }

            // Check if completion already exists by run_id
            const { data: existingByRunId } = await supabase
              .from("extra_completions")
              .select("id, completed_at, profile_id")
              .eq("run_id", entry.run_id)
              .maybeSingle();

            // Handle username changes - if run exists but profile differs
            if (existingByRunId && existingByRunId.profile_id !== profile.id) {
              const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id, username, user_id")
                .eq("id", existingByRunId.profile_id)
                .maybeSingle();

              if (existingProfile && existingProfile.username !== entry.username) {
                // User changed their in-game username
                if (!profile.user_id) {
                  // Merge: update old profile username and transfer completions
                  await supabase
                    .from("extra_completions")
                    .update({ profile_id: existingProfile.id })
                    .eq("profile_id", profile.id);

                  await supabase
                    .from("profiles")
                    .update({ username: entry.username })
                    .eq("id", existingProfile.id);

                  // Delete duplicate empty profile
                  const { data: profileCompletions } = await supabase
                    .from("extra_completions")
                    .select("id")
                    .eq("profile_id", profile.id)
                    .limit(1);

                  if (!profileCompletions || profileCompletions.length === 0) {
                    await supabase.from("profiles").delete().eq("id", profile.id);
                    console.log(`Merged extra completions: ${existingProfile.username} -> ${entry.username}`);
                  }

                  profile = { id: existingProfile.id, user_id: existingProfile.user_id };
                }
              }
              continue;
            }

            // Check if completion already exists for this profile/level combo
            const { data: existingCompletion } = await supabase
              .from("extra_completions")
              .select("id, completed_at")
              .eq("profile_id", profile.id)
              .eq("level_id", level.id)
              .maybeSingle();

            if (existingCompletion) {
              // Track oldest for verifier determination
              if (!oldestCompletion || new Date(existingCompletion.completed_at) < new Date(oldestCompletion.completed_at)) {
                oldestCompletion = { profile_id: profile.id, completed_at: existingCompletion.completed_at };
              }
              continue;
            }

            // Fetch run details to get actual completion date
            let completedAt = new Date().toISOString();
            try {
              const runResponse = await fetch(`${API_BASE}/runs/${entry.run_id}`);
              if (runResponse.ok) {
                const runDetails = await runResponse.json();
                if (runDetails.finishedAt) {
                  completedAt = runDetails.finishedAt;
                }
              }
            } catch (runError) {
              console.error(`Error fetching run details for ${entry.run_id}:`, runError);
            }

            // Insert new completion
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

            // Track oldest completion
            if (!oldestCompletion || new Date(completedAt) < new Date(oldestCompletion.completed_at)) {
              oldestCompletion = { profile_id: profile.id, completed_at: completedAt };
            }
          }
        } catch (error) {
          console.error(`Error processing level ID ${currentLevelId}:`, error);
          continue;
        }
      }

      // Update verifier if needed (oldest completion becomes verifier)
      if (oldestCompletion && oldestCompletion.profile_id !== level.verifier_profile_id) {
        await supabase
          .from("extended_levels")
          .update({ verifier_profile_id: oldestCompletion.profile_id })
          .eq("id", level.id);
        console.log(`Updated verifier for ${level.level_id} to ${oldestCompletion.profile_id}`);
      }
    }

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
