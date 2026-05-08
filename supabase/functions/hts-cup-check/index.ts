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

function formatTime(seconds: number): string {
  return `${Number(seconds).toFixed(3)}s`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { round_id, dry_run } = await req.json();
    if (!round_id) {
      return new Response(JSON.stringify({ error: "round_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: round, error } = await supabase
      .from("hts_cup_rounds")
      .select("*")
      .eq("id", round_id)
      .single();
    if (error || !round) throw new Error("Round not found");
    if (!round.enabled) {
      return new Response(JSON.stringify({ error: "Round disabled" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trackedPlayers: string[] = (round.player_usernames || []).map((u: string) => u.trim()).filter(Boolean);
    const trackedLower = new Set(trackedPlayers.map((u) => u.toLowerCase()));
    const levelIds: string[] = (round.level_ids || []).map((l: string) => l.trim()).filter(Boolean);

    // Map: lowercased username -> { username, time, level_id, run_id }
    const best = new Map<string, { username: string; time: number; level_id: string; run_id: number; arrow_name: string }>();

    for (const lid of levelIds) {
      try {
        const r = await fetch(`${API_BASE}/leaderboard?levelId=${encodeURIComponent(lid)}`);
        if (!r.ok) continue;
        const entries: LeaderboardEntry[] = await r.json();
        for (const e of entries) {
          const key = (e.username || "").toLowerCase();
          if (!trackedLower.has(key)) continue;
          const existing = best.get(key);
          if (!existing || e.completion_time < existing.time) {
            best.set(key, {
              username: e.username,
              time: e.completion_time,
              level_id: lid,
              run_id: e.run_id,
              arrow_name: e.arrow_name,
            });
          }
        }
        await new Promise((res) => setTimeout(res, 200));
      } catch (err) {
        console.error("Leaderboard fetch failed for", lid, err);
      }
    }

    // Sort qualifiers by time
    const sorted = Array.from(best.values()).sort((a, b) => a.time - b.time);
    const qualifyLimit = Math.max(1, Number(round.qualify_limit) || 3);
    const qualifiers = sorted.slice(0, qualifyLimit);
    const eliminated = sorted.slice(qualifyLimit);

    // Players who have not played any of the tracked levels yet
    const playedLower = new Set(sorted.map((s) => s.username.toLowerCase()));
    const noShow = trackedPlayers.filter((u) => !playedLower.has(u.toLowerCase()));
    const allEliminated = [...eliminated.map((e) => e.username), ...noShow];

    // Build embed
    const trophyEmojis = ["🥇", "🥈", "🥉"];
    const qualifierLines = qualifiers
      .map((q, i) => {
        const medal = trophyEmojis[i] || `**#${i + 1}**`;
        return `${medal} **${q.username}** — \`${formatTime(q.time)}\``;
      })
      .join("\n") || "_No qualifiers yet_";

    const eliminatedLine =
      allEliminated.length > 0
        ? allEliminated.map((u) => `~~${u}~~`).join(" • ")
        : "_None_";

    const embed = {
      title: `🏆 HTS Cup — ${round.round_name}`,
      description:
        `**Top ${qualifyLimit} qualify** • Tracking ${trackedPlayers.length} players across ${levelIds.length} level${levelIds.length === 1 ? "" : "s"}\n\u200b`,
      color: 0xfbbf24,
      fields: [
        {
          name: "✅ Qualified",
          value: qualifierLines,
          inline: false,
        },
        {
          name: "❌ Eliminated",
          value: eliminatedLine,
          inline: false,
        },
        {
          name: "\u200b",
          value: qualifiers.length >= qualifyLimit
            ? "🔥 **Round complete!** Good luck to the qualifying players in the next round."
            : `⏳ Waiting on ${qualifyLimit - qualifiers.length} more qualifier${qualifyLimit - qualifiers.length === 1 ? "" : "s"}...`,
          inline: false,
        },
      ],
      footer: { text: `HTS Cup • Live tracking` },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      content: null,
      embeds: [embed],
      allowed_mentions: { parse: [] },
    };

    if (!dry_run && round.webhook_url) {
      const res = await fetch(round.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Discord webhook failed ${res.status}: ${txt}`);
      }

      await supabase
        .from("hts_cup_rounds")
        .update({ last_posted_at: new Date().toISOString(), last_payload: payload })
        .eq("id", round_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        qualifiers,
        eliminated: allEliminated,
        payload,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
