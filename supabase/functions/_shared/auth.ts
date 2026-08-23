import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** True when the request carries the internal shared secret (cron / server-to-server). */
export function hasInternalSecret(req: Request): boolean {
  const provided = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  return !!provided && !!expected && provided === expected;
}

/** True when the request carries a valid JWT belonging to an admin / head admin. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return false;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData?.user) return false;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: isHead } = await admin.rpc("is_head_admin", {
    _user_id: userData.user.id,
  });
  if (isHead === true) return true;

  const { data: hasAdmin } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  return hasAdmin === true;
}

/** True when the request carries a valid JWT belonging to any level rater. */
export async function isLevelRaterRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return false;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData?.user) return false;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("level_raters")
    .select("id")
    .eq("user_id", userData.user.id)
    .or("can_main.eq.true,can_future.eq.true,can_extra.eq.true")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Allow admins or internal (cron) callers. Returns null when allowed, else a 401 response. */
export async function requireAdminOrInternal(
  req: Request,
): Promise<Response | null> {
  if (hasInternalSecret(req)) return null;
  if (await isAdminRequest(req)) return null;
  return unauthorized();
}

/** Allow admins, level raters, or internal callers. For low-risk notification functions. */
export async function requireAdminOrRaterOrInternal(
  req: Request,
): Promise<Response | null> {
  if (hasInternalSecret(req)) return null;
  if (await isAdminRequest(req)) return null;
  if (await isLevelRaterRequest(req)) return null;
  return unauthorized();
}
