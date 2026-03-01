

# Final Version Plan: Narrowlist Polishing and Bug Fixes

## Overview
This plan addresses all remaining issues to finalize the site: navigation changes, points system DB fix, admin panel improvements, resync overwrite protection, extended list admin tab, webhook template expansion, extra list rank deduplication, and data tracking.

---

## 1. Move Extended List to Dropdown Menu

**File:** `src/components/Navbar.tsx`

Move "Extended List" from `mainNavItems` into the `moreNavItems` array, positioned above "Extra List". The navbar main links will show: Main List, Future List, Leaderboard. The dropdown "More" menu will show: Extended List, Extra List, Recent Runs, Compare Players, etc.

---

## 2. Fix Points System (DB Function Mismatch)

**Current bug:** The database function `calculate_points_for_rank()` still uses OLD tiers (#1=30, #3=20, #6-10=9, etc.) while the frontend `calculatePoints()` uses the CORRECT new tiers (#1=28, #3=21, #6-10=13, etc.). This means displayed points look correct, but actual stored points in the DB are wrong.

**Fix:**
- SQL migration to update `calculate_points_for_rank()` to match the new tiers:
  - #1=28, #2=24, #3=21, #4=18, #5=16, #6-10=13, #11-20=10, #21-30=7, #31-50=4, #51-70=2, #71-100=1, 101+=0
- Recalculate all level points: `UPDATE levels SET points = calculate_points_for_rank(rank_position)`
- Recalculate all player total_points via `recalculate_player_points` for every profile

---

## 3. Fix Extra List Duplicate Ranks (Manual Data Fix)

**Current bug:** Multiple extra levels share ranks #2 (sixtuple ritf, ritf, matrix) and possibly others.

**Fix:** SQL migration to re-rank all `extended_levels` sequentially by current `rank_position` then `created_at`, ensuring unique ranks. The UNIQUE constraint on `rank_position` should already exist from a previous migration, but we'll verify and re-apply if needed.

---

## 4. Admin Panel - Extended List as Separate Tab

**File:** `src/pages/AdminPage.tsx`

Currently the `levels` tab in admin shows ALL levels from the `levels` table (both main list rank 1-100 and extended list rank 101+) but they're mixed together. 

**Changes:**
- Add a new "Extended" tab to the admin TabsList (between "Main" and "Future")
- The "Main" tab filters to show only levels with `rank_position <= 100`
- The "Extended" tab shows levels with `rank_position > 100`
- The Extended tab should have the same controls: search, move up/down, edit, delete, transfer to Extra List
- Moving levels between Main and Extended is just changing rank (e.g., moving last main list level to #101 makes it extended)
- Add a "Move to Extended" button on main list items and "Move to Main" on extended items
- Rank numbering is continuous (main list ends at #100, extended starts at #101)

---

## 5. Fix Extra List Edit Modal (Black Screen Bug)

**File:** `src/pages/AdminPage.tsx` (lines 4845-4986)

The edit modal for extra levels uses a raw `div` with `fixed inset-0` backdrop but lacks `overflow-y-auto` on the outer container and potentially has z-index issues. 

**Fix:**
- Add `overflow-y-auto` to the outer fixed container
- Ensure `max-h-[90vh] overflow-y-auto` is on the inner card
- Match the same modal pattern used by the main level edit modal (which works correctly)

---

## 6. Prevent Resync from Overwriting Manual Edits

**Files:** `supabase/functions/resync-main-levels/index.ts`, `supabase/functions/resync-extra-levels/index.ts`

**Current bug:** The resync functions overwrite `name` and `author` fields whenever they differ from the API. If an admin manually sets a custom name or creator, the next resync reverts it.

**Fix:** Add `name_override` and `author_override` boolean columns to `levels` and `extended_levels` tables. When an admin edits name/author in the admin panel, set the override flag to `true`. The resync functions will skip updating `name`/`author` when the override flag is set.

Alternative simpler approach: Only update name/author if the current DB value is NULL or equals a previously known API value. Even simpler: just skip name/author updates entirely in resync - admins can manually trigger a "refresh from API" if needed.

**Chosen approach (simplest):** In the resync functions, only update `name` if the current DB `name` is NULL, and only update `author` if the current DB `author` is NULL. This prevents overwrites while still populating missing data.

---

## 7. Webhook Panel - More Admin Action Templates

**Files:** `src/pages/AdminPage.tsx`, `supabase/functions/discord-notify/index.ts`, `supabase/functions/admin-notify/index.ts`

**Current state:** The webhook panel has 4 types (main_completions, extended_completions, extra_completions, rank_changes). The `rank_changes` type handles all admin actions with one template.

**Changes:**
- Add more template variables for rank_changes: `{action}` (e.g., "added", "deleted", "transferred", "moved"), `{adminEmail}`, `{sourceList}`, `{targetList}`
- Update the variable legend in the webhook settings UI to show all available variables for rank_changes
- Add better default fallback messages for each event type in `discord-notify`
- Ensure `admin-notify` passes the correct `webhook_type` and all variables
- Add webhook invocations for level transfers between lists (Main <-> Extended, Main <-> Extra)
- Update `sendAdminNotification` in AdminPage to pass `listType`, `action`, and other context

---

## 8. Remove Unnecessary Buttons in Admin Panel

**File:** `src/pages/AdminPage.tsx`

Clean up the admin panel:
- Remove the standalone "Hardfix" button (`triggerHardfix` function) - its functionality is covered by "Sync Completions" button on the Extra tab
- Remove the `hardfixing` state variable and related UI
- Keep "Check Empty" (useful), "Resync All" (useful), "Sync Now" (useful), "Bulk Import" (useful)
- Ensure "Check Verified Future" button works properly or remove if redundant

---

## 9. Data Tracking - Historical Main List Snapshots

The site already has `level_rank_history` for tracking rank changes over time and `HistoricalListViewer` component. 

**Enhancements:**
- Ensure the `handle_level_rank_change` trigger properly logs every rank change to `level_rank_history`
- The historical list viewer already works for viewing past states
- No additional changes needed here, the system already tracks rank history

---

## 10. sync-completions Still Uses Hardcoded Discord URL

**File:** `supabase/functions/sync-completions/index.ts` (line 10)

The `sync-completions` function still has a hardcoded `DISCORD_WEBHOOK_URL` and calls Discord directly instead of using the template-driven webhook system.

**Fix:** Replace the direct Discord call in `sendDiscordNotification()` with a call to `discord-notify` edge function (or inline the webhook lookup logic). This ensures all notifications respect the webhook settings and custom templates.

---

## Implementation Order

1. **SQL Migration** - Fix `calculate_points_for_rank()`, re-rank extra levels, recalculate all points
2. **Navbar** - Move Extended List to dropdown
3. **Resync functions** - Prevent name/author overwrite
4. **sync-completions** - Use webhook system instead of hardcoded URL
5. **Admin Panel** - Extended list tab, fix extra edit modal, remove hardfix button, improve webhook variables
6. **Webhook system** - Add more action types and variables

## Files to Modify

| File | Changes |
|------|---------|
| SQL migration | Fix point tiers, re-rank extra levels, recalculate points |
| `src/components/Navbar.tsx` | Move Extended List to dropdown |
| `src/pages/AdminPage.tsx` | Add Extended tab, fix edit modal, remove hardfix, webhook improvements |
| `supabase/functions/resync-main-levels/index.ts` | Skip name/author if not NULL |
| `supabase/functions/resync-extra-levels/index.ts` | Skip name/author if not NULL |
| `supabase/functions/sync-completions/index.ts` | Use webhook system |
| `supabase/functions/discord-notify/index.ts` | More action variables |
| `supabase/functions/admin-notify/index.ts` | Pass more context variables |

