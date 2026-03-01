import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  return `${seconds.toFixed(3)}s`;
}

function getArrowEmoji(arrowName: string | null): string {
  if (!arrowName) return '';
  const normalized = arrowName.toLowerCase().trim();
  return ARROW_EMOJIS[normalized] || '';
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { webhook_type } = body;

    console.log('Received notification request:', { webhook_type, ...body });

    // Look up webhook settings for this type
    const { data: webhook } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('webhook_type', webhook_type)
      .single();

    if (!webhook || !webhook.enabled || !webhook.webhook_url) {
      console.log(`Webhook ${webhook_type} is disabled or not configured`);
      return new Response(
        JSON.stringify({ success: false, message: 'Webhook disabled or not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let message = '';

    if (webhook_type === 'main_completions' || webhook_type === 'extended_completions' || webhook_type === 'extra_completions') {
      // Completion notification
      const { 
        completion_type, completion_id, profile_id, level_id,
        player_name, level_name, level_rank, completion_time, 
        arrow_name, is_verifier 
      } = body;

      // Check if already notified
      const { data: existing } = await supabase
        .from('discord_notifications')
        .select('id')
        .eq('completion_type', completion_type)
        .eq('completion_id', String(completion_id))
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, message: 'Already notified' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const arrowEmoji = getArrowEmoji(arrow_name);
      const action = is_verifier ? 'verified' : 'completed';
      const formattedTime = formatTime(completion_time);

      const template = webhook.custom_message_template || '{arrow}**{user}** {action} **#{levelRank} {levelName}** in **{completionTime}**';
      
      message = applyTemplate(template, {
        user: player_name || 'Unknown',
        levelName: level_name || 'Unknown Level',
        levelRank: String(level_rank || '?'),
        completionTime: formattedTime,
        arrow: arrowEmoji,
        action: action,
      });

      // Record notification after sending
      const discordResponse = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();
        console.error('Discord webhook failed:', discordResponse.status, errorText);
        throw new Error(`Discord webhook failed: ${discordResponse.status}`);
      }

      // Record the notification
      await supabase.from('discord_notifications').insert({
        completion_type,
        completion_id: String(completion_id),
        profile_id,
        level_id,
      });

    } else if (webhook_type === 'rank_changes') {
      // Admin action notification
      const { event_type, level_name, old_rank, new_rank, list_type, details, action, admin_email } = body;

      let emoji = '';
      if (event_type === 'rank_change') emoji = new_rank < old_rank ? '⬆️' : '⬇️';
      else if (event_type === 'future_level') emoji = '📋';
      else if (event_type === 'level_addition') emoji = '✨';
      else if (event_type === 'level_deletion') emoji = '🗑️';
      else if (event_type === 'future_to_main') emoji = '🚀';
      else if (event_type === 'extra_level_added') emoji = '📦';
      else if (event_type === 'level_to_extra' || event_type === 'level_to_extended') emoji = '📤';
      else if (event_type === 'extra_to_main') emoji = '⬆️';
      else if (event_type === 'transferred') emoji = '🔄';

      const template = webhook.custom_message_template || '{emoji} **{levelName}** {action} #{newRank}';

      const variables: Record<string, string> = {
        levelName: level_name || 'Unknown',
        oldRank: String(old_rank || ''),
        newRank: String(new_rank || ''),
        emoji: emoji,
        listType: list_type || 'Main',
        action: action || event_type || 'updated',
        adminEmail: admin_email || 'unknown',
      };

      message = applyTemplate(template, variables);

      // For events without ranks, fall back to a descriptive message
      if (!old_rank && !new_rank && !webhook.custom_message_template) {
        if (event_type === 'level_addition') {
          message = `${emoji} **${level_name}** added at #${new_rank}`;
        } else if (event_type === 'level_deletion') {
          message = `${emoji} **${level_name}** removed from the list`;
        } else if (event_type === 'extra_level_added') {
          message = `${emoji} **${level_name}** added to the Extra List at #${new_rank}`;
        } else if (event_type === 'level_to_extra' || event_type === 'level_to_extended') {
          message = `${emoji} **${level_name}** transferred from ${list_type || 'Main'} List`;
        } else if (event_type === 'extra_to_main') {
          message = `${emoji} **${level_name}** transferred to Main List at #${new_rank}`;
        } else if (details) {
          message = details;
        }
      }

      const discordResponse = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();
        console.error('Discord webhook failed:', discordResponse.status, errorText);
        throw new Error(`Discord webhook failed: ${discordResponse.status}`);
      }
    }

    console.log('Discord message sent:', message);

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
