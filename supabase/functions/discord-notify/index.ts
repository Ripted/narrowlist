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

const COLOR = {
  green: 0x22c55e,
  blue: 0x3b82f6,
  purple: 0xa855f7,
  yellow: 0xeab308,
  red: 0xef4444,
  cyan: 0x06b6d4,
  gray: 0x6b7280,
  orange: 0xf97316,
}

const COMPLETIONS_URL = Deno.env.get('DISCORD_WEBHOOK_COMPLETIONS') ?? ''
const ADMIN_URL = Deno.env.get('DISCORD_WEBHOOK_ADMIN') ?? ''

function formatTime(seconds: number): string {
  const value = Number(seconds)
  return Number.isFinite(value) ? `${value.toFixed(3)}s` : '—'
}

function getArrowEmoji(arrowName: string | null): string {
  if (!arrowName) return ''
  return ARROW_EMOJIS[arrowName.toLowerCase().trim()] || ''
}

function levelUrl(levelId: string | null | undefined): string | null {
  if (!levelId) return null
  return `https://narrowarrow.xyz/level/${encodeURIComponent(levelId)}`
}

async function postWebhook(url: string, payload: unknown) {
  if (!url) {
    console.warn('Webhook URL missing, skipping')
    return
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Discord webhook failed:', res.status, text)
    throw new Error(`Discord webhook failed: ${res.status}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { webhook_type } = body

    console.log('discord-notify:', { webhook_type, event_type: body.event_type })

    // ============ COMPLETIONS ============
    if (
      webhook_type === 'main_completions' ||
      webhook_type === 'extended_completions' ||
      webhook_type === 'extra_completions'
    ) {
      const {
        completion_type, completion_id, profile_id, level_id,
        player_name, level_name, level_rank, completion_time,
        arrow_name, is_verifier,
      } = body

      // Dedupe
      const { data: existing } = await supabase
        .from('discord_notifications')
        .select('id')
        .eq('completion_type', completion_type)
        .eq('completion_id', String(completion_id))
        .maybeSingle()
      if (existing) {
        return new Response(JSON.stringify({ success: false, message: 'Already notified' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Fetch level string id + thumbnail
      let stringLevelId: string | null = null
      let thumbnail: string | null = null
      const table = webhook_type === 'extra_completions' ? 'extended_levels' : 'levels'
      const { data: lvl } = await supabase.from(table).select('level_id, thumbnail_url').eq('id', level_id).maybeSingle()
      if (lvl) { stringLevelId = lvl.level_id; thumbnail = lvl.thumbnail_url }

      const arrowEmoji = getArrowEmoji(arrow_name)
      const action = is_verifier ? 'verified' : 'completed'
      const listLabel = webhook_type === 'main_completions' ? 'Main'
        : webhook_type === 'extended_completions' ? 'Extended' : 'Extra'
      const color = webhook_type === 'main_completions' ? COLOR.green
        : webhook_type === 'extended_completions' ? COLOR.blue : COLOR.purple

      const url = levelUrl(stringLevelId)
      const title = `${arrowEmoji} ${player_name || 'Unknown'} ${action} #${level_rank || '?'} ${level_name || 'Unknown Level'}`.trim()

      const embed: Record<string, unknown> = {
        title,
        url: url || undefined,
        color,
        fields: [
          { name: 'Time', value: formatTime(completion_time), inline: true },
          { name: 'List', value: listLabel, inline: true },
          { name: 'Arrow', value: arrow_name || '—', inline: true },
        ],
        timestamp: new Date().toISOString(),
      }
      if (thumbnail) embed.thumbnail = { url: thumbnail }
      if (url) embed.footer = { text: 'narrowarrow.xyz' }

      const payload = { content: null, embeds: [embed], allowed_mentions: { parse: [] } }
      if (body.dry_run) {
        return new Response(JSON.stringify({ success: true, dry_run: true, payload }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await postWebhook(COMPLETIONS_URL, payload)

      await supabase.from('discord_notifications').insert({
        completion_type, completion_id: String(completion_id), profile_id, level_id,
      })

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ============ ADMIN / RANK CHANGES ============
    if (webhook_type === 'rank_changes') {
      const {
        event_type, level_name, old_rank, new_rank, list_type, details, admin_email, level_id: bodyLevelId,
        thumbnail_url: bodyThumbnailUrl, author: bodyAuthor, rank_position: bodyRankPosition, points: bodyPoints,
      } = body

      // Try to resolve level thumbnail + string level_id for embeds
      let thumbnail: string | null = bodyThumbnailUrl || null
      let stringLevelId: string | null = bodyLevelId || null
      let levelAuthor: string | null = bodyAuthor || null
      let levelRank: number | null = typeof bodyRankPosition === 'number' ? bodyRankPosition : null
      let levelPoints: number | null = typeof bodyPoints === 'number' ? bodyPoints : null
      if (level_name) {
        // best effort: search main list, then extended
        const { data: main } = await supabase.from('levels')
          .select('level_id, thumbnail_url, author, rank_position, points').eq('name', level_name).maybeSingle()
        if (main) {
          thumbnail = main.thumbnail_url
          stringLevelId = stringLevelId || main.level_id
          levelAuthor = main.author
          levelRank = main.rank_position
          levelPoints = main.points
        }
        if (!thumbnail) {
          const { data: ext } = await supabase.from('extended_levels')
            .select('level_id, thumbnail_url, author, rank_position, points').eq('name', level_name).maybeSingle()
          if (ext) {
            thumbnail = ext.thumbnail_url
            stringLevelId = stringLevelId || ext.level_id
            levelAuthor = ext.author
            levelRank = ext.rank_position
            levelPoints = ext.points
          }
        }
      }

      const listLabel = list_type || 'Main'
      let title = ''
      let description = ''
      let color = COLOR.gray
      let emoji = '📝'

      switch (event_type) {
        case 'level_addition':
          emoji = '✨'; color = COLOR.green
          title = `${emoji} Level added to ${listLabel} List`
          description = `**${level_name}** was added at **#${new_rank}**.`
          break
        case 'level_deletion':
          emoji = '🗑️'; color = COLOR.red
          title = `${emoji} Level removed from ${listLabel} List`
          description = `**${level_name}** was removed.`
          break
        case 'extra_level_added':
          emoji = '📦'; color = COLOR.purple
          title = `${emoji} Level added to the Extra List`
          description = `**${level_name}** was added at **#${new_rank}**.`
          break
        case 'future_to_main':
          emoji = '🚀'; color = COLOR.green
          title = `${emoji} Level promoted to Main List`
          description = `**${level_name}** moved from the Future List to the Main List at **#${new_rank}**.`
          break
        case 'extra_to_main':
          emoji = '⬆️'; color = COLOR.green
          title = `${emoji} Level promoted to Main List`
          description = `**${level_name}** transferred from the Extra List to the Main List at **#${new_rank}**.`
          break
        case 'level_to_extra':
        case 'level_to_extended':
          emoji = '📤'; color = COLOR.cyan
          title = `${emoji} Level moved to Extra List`
          description = `**${level_name}** was transferred from the ${listLabel} List to the Extra List.`
          break
        case 'future_level':
          emoji = '📋'; color = COLOR.blue
          title = `${emoji} Level added to Future List`
          description = `**${level_name}** was added at estimated **#${new_rank}**.`
          break
        case 'future_level_deleted':
          emoji = '🗑️'; color = COLOR.red
          title = `${emoji} Level removed from Future List`
          description = `**${level_name}** was removed from the Future List.`
          break
        case 'future_level_rank_change':
          emoji = new_rank < old_rank ? '⬆️' : '⬇️'; color = COLOR.yellow
          title = `${emoji} Future List rank change`
          description = `**${level_name}** moved from **#${old_rank}** to **#${new_rank}**.`
          break
        case 'rank_change':
          emoji = new_rank < old_rank ? '⬆️' : '⬇️'
          color = new_rank < old_rank ? COLOR.green : COLOR.orange
          title = `${emoji} Rank change on ${listLabel} List`
          description = `**${level_name}** moved from **#${old_rank}** to **#${new_rank}**.`
          break
        case 'pack_created':
          emoji = '🆕'; color = COLOR.green
          title = `${emoji} Level pack created`
          description = `Pack **${level_name}** was created.`
          break
        case 'pack_updated':
          emoji = '✏️'; color = COLOR.yellow
          title = `${emoji} Level pack updated`
          description = `Pack **${level_name}** was updated${details ? `\n\n${details}` : ''}.`
          break
        case 'pack_deleted':
          emoji = '🗑️'; color = COLOR.red
          title = `${emoji} Level pack deleted`
          description = `Pack **${level_name}** was deleted.`
          break
        default:
          title = `${emoji} ${level_name || 'Update'}`
          description = details || `${event_type || 'updated'}`
      }

      const fields: { name: string; value: string; inline?: boolean }[] = []
      if (stringLevelId) fields.push({ name: 'Level ID', value: `\`${stringLevelId}\``, inline: true })
      if (levelAuthor) fields.push({ name: 'Author', value: levelAuthor, inline: true })
      if (levelRank !== null) fields.push({ name: 'Current Rank', value: `#${levelRank}`, inline: true })
      if (levelPoints !== null) fields.push({ name: 'Points', value: String(levelPoints), inline: true })
      if (old_rank && new_rank) fields.push({ name: 'Rank', value: `#${old_rank} → #${new_rank}`, inline: true })
      else if (new_rank) fields.push({ name: 'Rank', value: `#${new_rank}`, inline: true })
      fields.push({ name: 'List', value: listLabel, inline: true })
      if (admin_email) fields.push({ name: 'By', value: admin_email, inline: false })
      if (details && event_type !== 'pack_updated') fields.push({ name: 'Details', value: details, inline: false })

      const url = levelUrl(stringLevelId)
      const embed: Record<string, unknown> = {
        title,
        url: url || undefined,
        description,
        color,
        fields,
        timestamp: new Date().toISOString(),
      }
      if (thumbnail) embed.thumbnail = { url: thumbnail }
      embed.footer = { text: 'narrowarrow.xyz' }

      const payload = { content: null, embeds: [embed], allowed_mentions: { parse: [] } }
      if (body.dry_run) {
        return new Response(JSON.stringify({ success: true, dry_run: true, payload }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await postWebhook(ADMIN_URL, payload)

      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: false, message: 'Unknown webhook_type' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in discord-notify:', error)
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
