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
      .select("id, level_id, points, rank_position")
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

    // Process each level
    for (const level of levels) {
      console.log(`Processing level: ${level.level_id}`);

      try {
        // Fetch leaderboard from external API
        const response = await fetch(`${API_BASE}/leaderboard?levelId=${level.level_id}`);
        
        if (!response.ok) {
          console.error(`Failed to fetch leaderboard for ${level.level_id}: ${response.status}`);
          continue;
        }

        const leaderboard: LeaderboardEntry[] = await response.json();
        console.log(`Found ${leaderboard.length} entries for level ${level.level_id}`);

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

          // Check if completion already exists
          const { data: existingCompletion } = await supabase
            .from("completions")
            .select("id")
            .eq("run_id", entry.run_id)
            .maybeSingle();

          if (existingCompletion) {
            continue; // Skip if already exists
          }

          // Fetch run details to get the actual completion date
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

          // Insert new completion with actual date
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
            console.error(`Error inserting completion:`, insertError);
            continue;
          }

          totalNewCompletions++;
          console.log(`Added completion: ${entry.username} on ${level.level_id}`);
        }
      } catch (error) {
        console.error(`Error processing level ${level.level_id}:`, error);
        continue;
      }
    }

    // Update profile total points
    console.log("Updating profile total points...");
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username");

    if (profiles) {
      for (const profile of profiles) {
        // Get all unique level completions for this profile
        const { data: completions } = await supabase
          .from("completions")
          .select("level_id, levels(points)")
          .eq("profile_id", profile.id);

        if (completions) {
          // Sum up points from unique levels
          const uniqueLevels = new Set<string>();
          let totalPoints = 0;
          
          for (const completion of completions) {
            if (!uniqueLevels.has(completion.level_id)) {
              uniqueLevels.add(completion.level_id);
              // Handle joined data which can be array or object
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

          await supabase
            .from("profiles")
            .update({ total_points: totalPoints })
            .eq("id", profile.id);
        }
      }
    }

    console.log(`Sync complete. Added ${totalNewCompletions} new completions.`);

    return new Response(
      JSON.stringify({ 
        message: "Sync complete", 
        newCompletions: totalNewCompletions,
        levelsProcessed: levels.length 
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
