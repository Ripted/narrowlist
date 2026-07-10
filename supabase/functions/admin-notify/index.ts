import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function now delegates to discord-notify with webhook_type='rank_changes'
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event_type, admin_email, level_name, old_rank, new_rank, details, list_type, action, level_id, dry_run } = body;

    console.log('Admin-notify delegating to discord-notify:', { event_type, level_name });

    // Delegate to discord-notify with rank_changes webhook type
    const { data, error } = await supabase.functions.invoke('discord-notify', {
      body: {
        webhook_type: 'rank_changes',
        event_type,
        level_name,
        old_rank,
        new_rank,
        details,
        level_id,
        list_type: list_type || 'Main',
        action: action || event_type,
        admin_email: admin_email || 'unknown',
        dry_run,
      },
    });

    if (error) {
      console.error('Failed to delegate to discord-notify:', error);
      throw error;
    }

    return new Response(
      JSON.stringify(data || { success: true }),
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
