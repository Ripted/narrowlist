import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
      ...extra,
    },
  });

// naive in-memory rate limit (per isolate)
const hits = new Map<string, { n: number; reset: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  entry.n++;
  return entry.n > 120;
}

const clampInt = (v: string | null, def: number, min: number, max: number) => {
  const n = v === null ? def : parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return json({ error: "Rate limit exceeded" }, 429);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/public-api/, "").replace(/\/+$/, "") || "/";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const limit = clampInt(url.searchParams.get("limit"), 100, 1, 250);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, 100_000);
  const rankMin = clampInt(url.searchParams.get("rank_min"), 1, 1, 100_000);
  const rankMax = clampInt(url.searchParams.get("rank_max"), 100_000, 1, 100_000);

  const shape = (row: Record<string, unknown>) => ({
    rank: row.rank_position,
    sub_rank: row.sub_rank ?? undefined,
    level_id: row.level_id,
    name: row.name,
    creators: row.creators ?? (row.author ? [row.author] : []),
    points: row.points,
    thumbnail_url: row.thumbnail_url,
    description: row.description ?? null,
    added_at: row.added_at,
  });

  const listQuery = async (table: string, extraOrder?: string) => {
    let q = supabase
      .from(table)
      .select("*", { count: "exact" })
      .gte("rank_position", rankMin)
      .lte("rank_position", rankMax)
      .order("rank_position", { ascending: true });
    if (extraOrder) q = q.order(extraOrder, { ascending: true });
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) return json({ error: error.message }, 500);
    return json({
      count: count ?? data?.length ?? 0,
      limit,
      offset,
      data: (data ?? []).map(shape),
    });
  };

  switch (path) {
    case "/":
      return json({
        name: "Narrowlist Public API",
        version: 1,
        endpoints: [
          "/public-api/main-list",
          "/public-api/extended-list",
          "/public-api/extra-list",
          "/public-api/future-list",
        ],
        params: ["limit", "offset", "rank_min", "rank_max"],
      });
    case "/main-list":
      return listQuery("levels");
    case "/extended-list":
      return listQuery("levels");
    case "/extra-list":
      return listQuery("extended_levels");
    case "/future-list":
      return listQuery("future_levels", "sub_rank");
    default:
      return json({ error: "Not found" }, 404);
  }
});
