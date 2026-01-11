import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      event_type,
      admin_email,
      level_name,
      old_rank,
      new_rank,
      details
    } = await req.json();

    console.log('Received admin notification request:', { event_type, level_name });

    // Get webhook settings
    const { data: settings } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('webhook_type', 'admin')
      .single();

    if (!settings || !settings.enabled) {
      console.log('Admin webhook is disabled or not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Webhook disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this event type should be sent
    let shouldSend = false;
    switch (event_type) {
      case 'rank_change':
        shouldSend = settings.include_rank_changes;
        break;
      case 'future_level':
        shouldSend = settings.include_future_levels;
        break;
      case 'level_addition':
        shouldSend = settings.include_level_additions;
        break;
      case 'level_deletion':
        shouldSend = settings.include_level_deletions;
        break;
      default:
        shouldSend = true;
    }

    if (!shouldSend) {
      console.log(`Event type ${event_type} is disabled in settings`);
      return new Response(
        JSON.stringify({ success: false, message: 'Event type disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine emoji based on event type
    let emoji = '';
    if (event_type === 'rank_change') {
      emoji = new_rank < old_rank ? '⬆️' : '⬇️';
    } else if (event_type === 'future_level') {
      emoji = '📋';
    } else if (event_type === 'level_addition') {
      emoji = '✨';
    } else if (event_type === 'level_deletion') {
      emoji = '🗑️';
    } else if (event_type === 'future_to_main') {
      emoji = '🚀';
    } else if (event_type === 'extra_level_added') {
      emoji = '📦';
    } else if (event_type === 'level_to_extra') {
      emoji = '📤';
    } else if (event_type === 'extra_to_main') {
      emoji = '⬆️';
    }

    let message = '';
    
    // Check if custom template is set
    if (settings.custom_message_template) {
      // Use custom template with variable replacement
      message = settings.custom_message_template
        .replace(/\[levelName\]/g, `**${level_name}**`)
        .replace(/\[oldRank\]/g, String(old_rank || ''))
        .replace(/\[newRank\]/g, String(new_rank || ''))
        .replace(/\[eventType\]/g, event_type)
        .replace(/\[emoji\]/g, emoji);
    } else {
      // Use default one-sentence format with bold level name
      if (event_type === 'rank_change') {
        message = `${emoji} **${level_name}** moved from #${old_rank} to #${new_rank}`;
      } else if (event_type === 'future_level') {
        message = `${emoji} **${level_name}** added to the future list at #${new_rank}`;
      } else if (event_type === 'level_addition') {
        message = `${emoji} **${level_name}** added to the main list at #${new_rank}`;
      } else if (event_type === 'level_deletion') {
        message = `${emoji} **${level_name}** removed from the list`;
      } else if (event_type === 'future_to_main') {
        message = `${emoji} **${level_name}** promoted to main list at #${new_rank}`;
      } else if (event_type === 'extra_level_added') {
        message = `${emoji} **${level_name}** added to the extra list at #${new_rank}`;
      } else if (event_type === 'level_to_extra') {
        message = `${emoji} **${level_name}** moved to extra list at #${new_rank}`;
      } else if (event_type === 'extra_to_main') {
        message = `${emoji} **${level_name}** promoted from extra list to main list at #${new_rank}`;
      } else {
        message = details || `Admin action: ${event_type}`;
      }
    }

    console.log('Sending Discord message:', message);

    // Send to Discord
    const discordResponse = await fetch(settings.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord webhook failed:', discordResponse.status, errorText);
      throw new Error(`Discord webhook failed: ${discordResponse.status}`);
    }

    console.log('Admin notification sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in admin-notify:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})