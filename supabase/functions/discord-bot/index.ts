// Narrowlist Discord bot — interactions endpoint (slash commands).
//
// Setup:
//   1. Create an application at https://discord.com/developers/applications
//   2. Set secrets: supabase secrets set DISCORD_PUBLIC_KEY=... DISCORD_BOT_TOKEN=...
//   3. Deploy: supabase functions deploy discord-bot
//   4. Register the /test command (one-time, e.g. with curl):
//        curl -X POST "https://discord.com/api/v10/applications/<APP_ID>/commands" \
//          -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
//          -H "Content-Type: application/json" \
//          -d '{"name":"test","description":"Check if the Narrowlist bot is alive"}'
//   5. In the developer portal set Interactions Endpoint URL to
//      https://<project>.supabase.co/functions/v1/discord-bot
import nacl from "https://esm.sh/tweetnacl@1.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp",
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function verifySignature(req: Request, body: string, publicKey: string): boolean {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  if (!signature || !timestamp) return false;
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(timestamp + body),
      hexToBytes(signature),
      hexToBytes(publicKey),
    );
  } catch {
    return false;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const publicKey = Deno.env.get("DISCORD_PUBLIC_KEY");
  if (!publicKey) {
    console.error("DISCORD_PUBLIC_KEY is not configured");
    return jsonResponse({ error: "Bot is not configured" }, 500);
  }

  const body = await req.text();
  if (!verifySignature(req, body, publicKey)) {
    return jsonResponse({ error: "Invalid request signature" }, 401);
  }

  let interaction: { type: number; data?: { name?: string } };
  try {
    interaction = JSON.parse(body);
  } catch {
    return jsonResponse({ error: "Invalid body" }, 400);
  }

  // Discord endpoint verification ping
  if (interaction.type === 1) {
    return jsonResponse({ type: 1 });
  }

  // Slash commands
  if (interaction.type === 2) {
    const commandName = interaction.data?.name;

    if (commandName === "test") {
      return jsonResponse({
        type: 4,
        data: {
          content: "✅ Narrowlist bot is online and working!",
          flags: 64, // ephemeral
        },
      });
    }

    return jsonResponse({
      type: 4,
      data: { content: `Unknown command: ${commandName ?? "?"}`, flags: 64 },
    });
  }

  return jsonResponse({ error: "Unsupported interaction type" }, 400);
});
