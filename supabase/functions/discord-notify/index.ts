import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454616761637933128/xq4O-w8IV4G1ZHU1-IUTV_G7WVl-z4z6cwaD51OK3dy2ZvcvJt44RmDP1JFvHOBqlsYf'

// Arrow emoji IDs
const ARROW_EMOJIS: Record<string, string> = {
  'narrow': '<:narrow:1454615571730534400>',
  'narrow arrow': '<:narrow:1454615571730534400>',
  'speedy': '<:speedy:1454615488544899326>',
  'speedy arrow': '<:speedy:1454615488544899326>',
  'energy': '<:energy:1454615450393510050>',
  'energy arrow': '<:energy:1454615450393510050>',
}

function formatTime(seconds: number): string {
  // The API returns completion_time in seconds (e.g., 101.234 = 101.234 seconds)
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
  }
  return `${seconds.toFixed(3)}s`;
}

function getArrowEmoji(arrowName: string | null): string {
  if (!arrowName) return '';
  const normalized = arrowName.toLowerCase().trim();
  return ARROW_EMOJIS[normalized] || '';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      completion_type, 
      completion_id, 
      profile_id, 
      level_id, 
      player_name, 
      level_name, 
      level_rank, 
      completion_time, 
      arrow_name,
      is_verifier 
    } = await req.json();

    console.log('Received notification request:', { 
      completion_type, 
      completion_id, 
      player_name, 
      level_name, 
      is_verifier 
    });

    // Check if already notified
    const { data: existing } = await supabase
      .from('discord_notifications')
      .select('id')
      .eq('completion_type', completion_type)
      .eq('completion_id', String(completion_id))
      .maybeSingle();

    if (existing) {
      console.log('Notification already sent for this completion');
      return new Response(
        JSON.stringify({ success: false, message: 'Already notified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Discord message
    const arrowEmoji = getArrowEmoji(arrow_name);
    const action = is_verifier ? 'verified' : 'completed';
    const formattedTime = formatTime(completion_time);
    
    const message = `${arrowEmoji}**${player_name}** ${action} **#${level_rank} ${level_name}** in **${formattedTime}**`;

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
      throw new Error(`Discord webhook failed: ${discordResponse.status}`);
    }

    console.log('Discord message sent successfully');

    // Record the notification
    const { error: insertError } = await supabase
      .from('discord_notifications')
      .insert({
        completion_type,
        completion_id: String(completion_id),
        profile_id,
        level_id,
      });

    if (insertError) {
      console.error('Failed to record notification:', insertError);
      // Don't throw - message was sent, just logging failed
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in discord-notify:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
