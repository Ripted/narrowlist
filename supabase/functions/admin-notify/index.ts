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

    console.log('Received admin notification request:', { event_type, admin_email, level_name });

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

    // Build the message based on format style and event type
    let message = '';
    const formatStyle = settings.format_style || 'formal';

    if (event_type === 'rank_change') {
      const direction = new_rank < old_rank ? '⬆️' : '⬇️';
      const change = Math.abs(new_rank - old_rank);
      
      if (formatStyle === 'formal') {
        message = `📊 **Rank Update**\n\n**${level_name}** has been moved from **#${old_rank}** to **#${new_rank}** (${direction} ${change} position${change !== 1 ? 's' : ''})\n\n*Updated by ${admin_email}*`;
      } else if (formatStyle === 'casual') {
        message = `${direction} ${level_name} moved from #${old_rank} → #${new_rank} by ${admin_email}`;
      } else {
        message = `${level_name}: #${old_rank} → #${new_rank}`;
      }
    } else if (event_type === 'future_level') {
      if (formatStyle === 'formal') {
        message = `📋 **New Future List Level**\n\n**${level_name}** has been added to the future list at position **#${new_rank}**\n\n*Added by ${admin_email}*`;
      } else if (formatStyle === 'casual') {
        message = `📋 New future level: ${level_name} at #${new_rank} by ${admin_email}`;
      } else {
        message = `Future: ${level_name} #${new_rank}`;
      }
    } else if (event_type === 'level_addition') {
      if (formatStyle === 'formal') {
        message = `✨ **New Level Added**\n\n**${level_name}** has been added to the main list at rank **#${new_rank}**\n\n*Added by ${admin_email}*`;
      } else if (formatStyle === 'casual') {
        message = `✨ New level: ${level_name} at #${new_rank} by ${admin_email}`;
      } else {
        message = `New: ${level_name} #${new_rank}`;
      }
    } else if (event_type === 'level_deletion') {
      if (formatStyle === 'formal') {
        message = `🗑️ **Level Removed**\n\n**${level_name}** has been removed from the list\n\n*Removed by ${admin_email}*`;
      } else if (formatStyle === 'casual') {
        message = `🗑️ Removed: ${level_name} by ${admin_email}`;
      } else {
        message = `Removed: ${level_name}`;
      }
    } else if (event_type === 'future_to_main') {
      if (formatStyle === 'formal') {
        message = `🚀 **Level Promoted to Main List**\n\n**${level_name}** has been moved from the future list to the main list at rank **#${new_rank}**\n\n*Promoted by ${admin_email}*`;
      } else if (formatStyle === 'casual') {
        message = `🚀 ${level_name} promoted to main list at #${new_rank} by ${admin_email}`;
      } else {
        message = `Promoted: ${level_name} #${new_rank}`;
      }
    } else {
      message = details || `Admin action: ${event_type}`;
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