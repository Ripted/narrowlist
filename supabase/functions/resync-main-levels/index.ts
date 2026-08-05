import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAdminOrInternal(req);
  if (authError) return authError;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all main levels
    const { data: levels, error: fetchError } = await supabaseClient
      .from("levels")
      .select("id, level_id, name, author, thumbnail_url")
      .order("rank_position");

    if (fetchError) {
      throw new Error(`Failed to fetch levels: ${fetchError.message}`);
    }

    if (!levels || levels.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No levels to resync", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const level of levels) {
      try {
        const apiUrl = `https://api.narrowarrow.xyz/level-details/${level.level_id}?isCustomLevel=true`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          errors.push(`Level ${level.level_id}: API returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        const levelInfo = data?.levelInfo;

        if (!levelInfo) {
          errors.push(`Level ${level.level_id}: No level info in API response`);
          continue;
        }

        const updates: Record<string, unknown> = {};
        
        // Only populate name/author if currently NULL (don't overwrite manual edits)
        if (!level.name && levelInfo.name) {
          updates.name = levelInfo.name;
        }
        
        if (!level.author && levelInfo.author) {
          updates.author = levelInfo.author;
        }

        // Fetch thumbnail if not set
        if (!level.thumbnail_url && data.thumbnail) {
          updates.thumbnail_url = data.thumbnail;
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseClient
            .from("levels")
            .update(updates)
            .eq("id", level.id);

          if (updateError) {
            errors.push(`Level ${level.level_id}: Update failed - ${updateError.message}`);
          } else {
            updatedCount++;
            console.log(`Updated level ${level.level_id}: ${JSON.stringify(updates)}`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Level ${level.level_id}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Resync complete. Updated ${updatedCount} of ${levels.length} levels.`,
        updated: updatedCount,
        total: levels.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Resync error:", errorMsg);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
