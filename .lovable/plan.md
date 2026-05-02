# Update Plan: Webhook Fix + Statistics + Guide + Socials + Submission + Manual Run Video

## 1. Fix "Level added" Discord webhook message

**Bug:** When a level is added, webhook says `Main: Watch your chain react moved from # to #7`. This happens because the default template renders `{action} #{newRank}` with `action="added"` — but admins with a custom template (`... {action} from #{oldRank} to #{newRank}`) get garbage when `oldRank` is undefined.

**Fix in `supabase/functions/discord-notify/index.ts` (rank_changes branch):**
- Build the message based on `event_type` FIRST, *before* falling back to the custom template.
- Use event-specific defaults that always render correctly:
  - `level_addition` → `✨ **{name}** added to {list} List at #{newRank}`
  - `rank_change` → `{emoji} **{name}** moved from #{oldRank} to #{newRank} on {list} List`
  - `level_deletion` → `🗑️ **{name}** removed from {list} List`
  - `future_to_main` / `extra_to_main` / `level_to_extra` → already-good messages
- For custom templates: only apply when the event has both ranks, OR substitute empty rank tokens with cleaner fallbacks (e.g. strip ` from #` when `oldRank` empty).
- Simpler: detect `level_addition` and bypass `applyTemplate`, always sending the dedicated "added at #X" line.

## 2. Statistics Page enhancements

**File:** `src/pages/StatisticsPage.tsx`

Add new sections (read-only aggregations from existing tables):
- **Most Completed Levels** (top 10) — counts from `completions` + `manual_runs` (main) and `extra_completions` + manual_runs (extra).
- **Hardest Levels** — top 10 by average difficulty (`level_difficulty_votes`), min 3 votes.
- **Highest Rated Levels** — top 10 by overall rating (avg of enjoyment/design/decoration/gameplay), min 3 ratings.
- **Top Verifiers** — count of levels where a profile is `verifier_profile_id`.
- **Most Active Players (last 30 days)** — completions count grouped by profile in last 30d.
- **Country Distribution** — players grouped by `country_code`.
- **Recent Records broken** — show recent fastest times.

Use existing React Query patterns; cap to top 10; small cards.

## 3. Guide Page: Difficulty system section

**File:** `src/pages/GuidePage.tsx`

Add a new tab or section explaining:
- The D0–D8 scale (0.1 increments)
- How votes are aggregated (average)
- Who can vote (only completers + admins)
- Where it's displayed (level page, sortable on lists)
- Visual scale breakdown (e.g. D0–D2 beginner, D3–D5 intermediate, D6–D8 expert)

## 4. Player profile socials (Discord / TikTok / YouTube)

**Schema migration:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN discord_url text,
  ADD COLUMN tiktok_url text,
  ADD COLUMN youtube_url text;
```
All optional. Existing RLS already allows owners to update their profile.

**UI:**
- `src/pages/PlayerPage.tsx` — show social icons (linkified) under the profile header when present.
- Add edit fields (only visible when `profile.user_id === auth.user.id`):
  - Either inline edit pencil, or in an "Edit profile" modal/section.
  - Validate URLs (basic `https?://` check + length cap 500).
  - Save via `supabase.from('profiles').update({...}).eq('id', profile.id)`.
- Use lucide icons: `MessageCircle` (Discord), custom or `Music2` (TikTok), `Youtube`.

## 5. Submission target list

Already implemented — verified in `SubmitLevelPage.tsx` (lines 618–633). **No changes needed.** Will mention in update log that it's already live.

## 6. Manual runs: video URL OR screenshot URL

**File:** `src/pages/AdminPage.tsx` (manual run dialog around lines 2700–2800)

The DB column is `proof_url` (single text). Reuse it — accept either an image URL or a video URL (YouTube, Twitch, Streamable, direct mp4, etc.). Changes:
- Rename label from "Proof Screenshot" → "Proof (Screenshot or Video URL)".
- Add a small note: "Paste an image URL, video URL (YouTube/Twitch/Streamable/MP4), or upload a screenshot."
- In the review/display areas, detect type by extension/host and render `<video>` or YouTube embed when applicable, otherwise the existing image preview / link.
- Helper `isVideoUrl(url)` covering: `.mp4 .webm .mov`, `youtube.com|youtu.be`, `twitch.tv`, `streamable.com`.

No schema change.

## Files to change

| File | Change |
|------|--------|
| `supabase/functions/discord-notify/index.ts` | Per-event-type message builder; "added" never shows "moved from #" |
| `src/pages/StatisticsPage.tsx` | Add 5–6 new stat cards/sections |
| `src/pages/GuidePage.tsx` | New "Difficulty" section/tab |
| `supabase/migrations/...` | Add `discord_url`, `tiktok_url`, `youtube_url` to `profiles` |
| `src/pages/PlayerPage.tsx` | Display + edit socials (owner-only) |
| `src/pages/AdminPage.tsx` | Manual-run proof: accept video URLs, render embeds |

## Implementation order

1. Migration (profile socials)
2. Discord webhook fix + redeploy `discord-notify`
3. Manual-run video support
4. Player socials UI
5. Statistics expansions
6. Guide difficulty section
