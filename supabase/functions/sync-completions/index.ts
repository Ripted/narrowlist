import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://api.narrowarrow.xyz";

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454616761637933128/xq4O-w8IV4G1ZHU1-IUTV_G7WVl-z4z6cwaD51OK3dy2ZvcvJt44RmDP1JFvHOBqlsYf';

// Arrow emoji IDs
const ARROW_EMOJIS: Record<string, string> = {
  'narrow': '<:narrow:1454615571730534400>',
  'narrow arrow': '<:narrow:1454615571730534400>',
  'speedy': '<:speedy:1454615488544899326>',
  'speedy arrow': '<:speedy:1454615488544899326>',
  'energy': '<:energy:1454615450393510050>',
  'energy arrow': '<:energy:1454615450393510050>',
};

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
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
    
    // Check if already notified
    const { data: existing } = await supabase
      .from('discord_notifications')
      .select('id')
      .eq('completion_type', 'completion')
      .eq('completion_id', String(completion.run_id))
      .maybeSingle();

    if (existing) {
      console.log(`Discord notification already sent for run ${completion.run_id}`);
      return;
    }

    // Build the Discord message
    const arrowEmoji = getArrowEmoji(completion.arrow_name);
    const action = completion.is_verifier ? 'verified' : 'completed';
    const formattedTime = formatTime(completion.completion_time);
    
    const message = `${arrowEmoji}**${completion.username}** ${action} **#${completion.level_rank} ${completion.level_name || 'Unknown Level'}** in **${formattedTime}**`;

    console.log('Sending Discord message:', message);

    // Send to Discord
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord webhook failed:', discordResponse.status, errorText);
      return;
    }

    console.log('Discord message sent successfully for', completion.username);

    // Record the notification
    const { error: insertError } = await supabase
      .from('discord_notifications')
      .insert({
        completion_type: 'completion',
        completion_id: String(completion.run_id),
        profile_id: completion.profile_id,
        level_id: completion.level_db_id,
      });
    
    if (insertError) {
      console.error('Error recording notification:', insertError);
    }

  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sync-completions...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all levels from database
    const { data: levels, error: levelsError } = await supabase
      .from("levels")
      .select("id, level_id, name, points, rank_position, verifier_profile_id, alternative_ids")
      .order("rank_position", { ascending: true });

    if (levelsError) {
      console.error("Error fetching levels:", levelsError);
      throw levelsError;
    }

    if (!levels || levels.length === 0) {
      console.log("No levels found in database");
      return new Response(
        JSON.stringify({ message: "No levels to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${levels.length} levels to sync`);

    let totalNewCompletions = 0;
    const newCompletions: NewCompletion[] = [];

    // Process each level
    for (const level of levels as DbLevel[]) {
      console.log(`Processing level: ${level.level_id}`);

      // Collect all level IDs to fetch (main + alternatives)
      const levelIdsToFetch = [level.level_id, ...(level.alternative_ids || [])];
      
      // Track oldest completion for this level (across main and alternatives)
      let oldestCompletion: { profile_id: string; completed_at: string } | null = null;

      for (const currentLevelId of levelIdsToFetch) {
        try {
          // Fetch leaderboard from external API
          const response = await fetch(`${API_BASE}/leaderboard?levelId=${currentLevelId}`);
          
          if (!response.ok) {
            console.error(`Failed to fetch leaderboard for ${currentLevelId}: ${response.status}`);
            continue;
          }

          const leaderboard: LeaderboardEntry[] = await response.json();
          
          if (currentLevelId === level.level_id) {
            console.log(`Found ${leaderboard.length} entries for main level ${level.level_id}`);
          } else {
            console.log(`Found ${leaderboard.length} entries for alternative ${currentLevelId} -> main ${level.level_id}`);
          }

          // Process each completion
          for (const entry of leaderboard) {
            // Get or create profile
            let { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("id")
              .eq("username", entry.username)
              .maybeSingle();

            if (profileError) {
              console.error(`Error fetching profile for ${entry.username}:`, profileError);
              continue;
            }

            // Create profile if it doesn't exist
            if (!profile) {
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({ username: entry.username })
                .select("id")
                .single();

              if (createError) {
                console.error(`Error creating profile for ${entry.username}:`, createError);
                continue;
              }
              profile = newProfile;
              console.log(`Created new profile for ${entry.username}`);
            }

            // Check if completion already exists for this run
            const { data: existingCompletion } = await supabase
              .from("completions")
              .select("id, completed_at")
              .eq("run_id", entry.run_id)
              .maybeSingle();

            let completedAt = existingCompletion?.completed_at;

            if (!existingCompletion) {
              // Also check if this profile already has a completion for this level (from main or any alternative)
              const { data: existingLevelCompletion } = await supabase
                .from("completions")
                .select("id")
                .eq("profile_id", profile.id)
                .eq("level_id", level.id)
                .maybeSingle();

              if (existingLevelCompletion) {
                // Profile already has a completion for this level, skip
                continue;
              }

              // Fetch run details to get the actual completion date
              completedAt = new Date().toISOString();
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

              // Insert new completion - always link to main level ID
              const { error: insertError } = await supabase
                .from("completions")
                .insert({
                  profile_id: profile.id,
                  level_id: level.id, // Always use main level's DB ID
                  run_id: entry.run_id,
                  completion_time: entry.completion_time,
                  arrow_name: entry.arrow_name,
                  completed_at: completedAt,
                });

              if (insertError) {
                if (insertError.code === '23505') {
                  // Duplicate, skip
                  continue;
                }
                console.error(`Error inserting completion:`, insertError);
                continue;
              }

              totalNewCompletions++;
              if (currentLevelId === level.level_id) {
                console.log(`Added completion: ${entry.username} on ${level.level_id}`);
              } else {
                console.log(`Added completion: ${entry.username} on alt ${currentLevelId} -> main ${level.level_id}`);
              }

              // Track new completion for Discord notification
              // Check if this is the verifier (first/oldest completion)
              const isVerifier = !oldestCompletion || (completedAt && new Date(completedAt) < new Date(oldestCompletion.completed_at));
              
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
            }

            // Track oldest completion for this level (for verifier)
            if (completedAt) {
              if (!oldestCompletion || new Date(completedAt) < new Date(oldestCompletion.completed_at)) {
                oldestCompletion = { profile_id: profile.id, completed_at: completedAt };
              }
            }
          }
        } catch (error) {
          console.error(`Error processing level ID ${currentLevelId}:`, error);
          continue;
        }
      }

      // Check if there's a manual run marked as verifier for this level
      const { data: manualVerifier } = await supabase
        .from("manual_runs")
        .select("profile_id, completed_at")
        .eq("level_id", level.id)
        .eq("is_verifier", true)
        .limit(1)
        .maybeSingle();

      // Determine verifier: manual run verifier takes priority, otherwise oldest completion
      let verifierProfileId: string | null = null;
      
      if (manualVerifier) {
        verifierProfileId = manualVerifier.profile_id;
        console.log(`Level ${level.level_id}: Using manual verifier ${manualVerifier.profile_id}`);
      } else if (oldestCompletion) {
        verifierProfileId = oldestCompletion.profile_id;
        console.log(`Level ${level.level_id}: Using oldest completion as verifier ${oldestCompletion.profile_id}`);
      }

      // Update level's verifier_profile_id if different
      if (verifierProfileId && verifierProfileId !== level.verifier_profile_id) {
        const { error: updateError } = await supabase
          .from("levels")
          .update({ verifier_profile_id: verifierProfileId })
          .eq("id", level.id);
        
        if (updateError) {
          console.error(`Error updating verifier for ${level.level_id}:`, updateError);
        } else {
          console.log(`Updated verifier for ${level.level_id} to ${verifierProfileId}`);
        }
      }
    }

    // Update profile total points
    console.log("Updating profile total points...");
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username");

    if (profiles) {
      for (const profile of profiles) {
        // Get all unique level completions for this profile from both completions and manual_runs
        const { data: completions } = await supabase
          .from("completions")
          .select("level_id, levels(points)")
          .eq("profile_id", profile.id);

        const { data: manualRuns } = await supabase
          .from("manual_runs")
          .select("level_id, levels(points)")
          .eq("profile_id", profile.id);

        // Sum up points from unique levels
        const uniqueLevels = new Set<string>();
        let totalPoints = 0;
        
        // Process regular completions
        if (completions) {
          for (const completion of completions) {
            if (!uniqueLevels.has(completion.level_id)) {
              uniqueLevels.add(completion.level_id);
              const levelsData = completion.levels;
              if (levelsData && typeof levelsData === "object") {
                const points = Array.isArray(levelsData) 
                  ? (levelsData[0] as { points?: number })?.points 
                  : (levelsData as { points?: number }).points;
                if (typeof points === "number") {
                  totalPoints += points;
                }
              }
            }
          }
        }

        // Process manual runs
        if (manualRuns) {
          for (const run of manualRuns) {
            if (!uniqueLevels.has(run.level_id)) {
              uniqueLevels.add(run.level_id);
              const levelsData = run.levels;
              if (levelsData && typeof levelsData === "object") {
                const points = Array.isArray(levelsData) 
                  ? (levelsData[0] as { points?: number })?.points 
                  : (levelsData as { points?: number }).points;
                if (typeof points === "number") {
                  totalPoints += points;
                }
              }
            }
          }
        }

        await supabase
          .from("profiles")
          .update({ total_points: totalPoints })
          .eq("id", profile.id);
      }
    }

    // Send Discord notifications for new completions
    console.log(`Sending Discord notifications for ${newCompletions.length} new completions...`);
    for (const completion of newCompletions) {
      await sendDiscordNotification(supabaseUrl, supabaseKey, completion);
      // Small delay to avoid rate limiting
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
