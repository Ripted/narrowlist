

# Extra List Rank Fix, New Point System, Extended List, and Webhook Overhaul

## Overview

This plan covers four major areas:
1. Fix duplicate ranks in the Extra List (data cleanup + prevention)
2. New Main List point system (top 100 only)
3. Re-introduce the Extended List (ranks 101+, no points)
4. Redesigned webhook system with per-event webhooks and customizable message templates

---

## 1. Fix Extra List Duplicate Ranks

**Current state:** The `extended_levels` table has duplicate ranks at positions 1, 2, 3, 4, 5, and 50. There are 55 total extra levels.

**Data fix:** Run a SQL migration that re-ranks all 55 extra levels sequentially (ordered by current `rank_position` then `created_at`) so every rank is unique.

**Prevention:** Add a UNIQUE constraint on `extended_levels.rank_position` so duplicates can never occur again. The same constraint should be verified on `levels.rank_position`.

---

## 2. New Main List Point System

Update the point calculation everywhere it exists:

| Rank | Points |
|------|--------|
| #1 | 28 |
| #2 | 24 |
| #3 | 21 |
| #4 | 18 |
| #5 | 16 |
| #6-10 | 13 |
| #11-20 | 10 |
| #21-30 | 7 |
| #31-50 | 4 |
| #51-70 | 2 |
| #71-100 | 1 |

The main list is capped at 100 levels. Currently there are 94 levels, so no truncation is needed yet.

**Files to update:**
- `src/config/levels.ts` - `getPointsForRank()` function
- `src/pages/AdminPage.tsx` - `calculatePoints()` function
- `src/pages/GuidePage.tsx` - Points table display
- Database function `calculate_points_for_rank()` - the authoritative source

After updating the DB function, run a migration to recalculate all level points and player total_points.

---

## 3. Extended List (Ranks 101+)

**Concept:** Levels that are not hard enough for the top 100 but still notable go into the "Extended List." This is a separate tab/page showing levels starting from rank 101. No points are awarded.

**Implementation:**
- Create a new database table `extension_levels` (or reuse a concept) -- actually, the simplest approach is to keep using the existing `levels` table but display levels with `rank_position > 100` in a separate "Extended List" page. This way ranking and management stays unified.
- However, since the user wants it as a clearly separate list, and the `extended_levels` table already exists (currently used for "Extra List"), we need to be careful with naming.

**Naming clarification:**
- "Main List" = top 100 hardest levels (awards points)
- "Extended List" = levels ranked 101+ that are hard but not top 100 (no points, extension of main list)
- "Extra List" = levels that don't meet main list standards at all (awards Extra Points)

**Approach:** Use the `levels` table for both Main and Extended. Levels with `rank_position <= 100` are "Main List" and get points. Levels with `rank_position > 100` are "Extended List" and get 0 points. This keeps ranking unified -- moving a level from #99 to #101 naturally transitions it.

**Changes:**
- Update `calculate_points_for_rank()` DB function to return 0 for rank > 100
- Create a new page `src/pages/ExtendedListPage.tsx` that shows levels with rank > 100
- Add route `/extended-list` in `App.tsx`
- Add "Extended List" to navbar
- The Index page filters to only show levels with rank <= 100
- Admin panel continues to manage all levels in one unified list

---

## 4. Guide Page Update

Update the Guide page to reflect:
- New point system table
- Main List description: "The top 100 hardest levels in Narrow Arrow"
- Extended List description: "Levels ranked 101+ that extend the main list. No points awarded."
- Extra List description: "Levels that don't meet main list standards. Awards separate Extra Points."
- Add Extended List to the features grid and quick actions

---

## 5. Webhook System Overhaul

**Current state:** Two webhook entries (`admin` and `completions`) with a hardcoded Discord URL in `discord-notify`. Toggle flags like `include_completions`, `include_rank_changes` etc. on the admin webhook.

**New design:** Replace with individual webhook entries, each with its own URL and customizable message template using `{variable}` syntax.

### New Webhook Types:
1. `main_completions` - Main list completions and verifications
2. `extended_completions` - Extended list completions (rank 101+) 
3. `extra_completions` - Extra list completions
4. `rank_changes` - Admin rank changes, level additions/deletions, transfers

### Database Changes:
- Drop the old boolean toggle columns from `webhook_settings`
- Simplify to: `id`, `webhook_type`, `webhook_url`, `enabled`, `custom_message_template`, `created_at`, `updated_at`
- Seed default rows for each type

### Template Variables:
- `{user}` - Player username
- `{levelName}` - Level name
- `{levelRank}` - Level rank position
- `{completionTime}` - Formatted completion time
- `{arrow}` - Arrow emoji
- `{action}` - "completed" or "verified"
- `{oldRank}` - Previous rank (for rank changes)
- `{newRank}` - New rank (for rank changes)
- `{emoji}` - Event-type emoji
- `{listType}` - "Main", "Extended", or "Extra"

### Default Templates:
- Completions: `{arrow}**{user}** {action} **#{levelRank} {levelName}** in **{completionTime}**`
- Rank changes: `{emoji} **{levelName}** moved from #{oldRank} to #{newRank}`

### Edge Function Changes:
- Rewrite `discord-notify` to look up the appropriate webhook by type, apply the message template, and send
- Remove hardcoded webhook URL
- Rewrite `admin-notify` to use the `rank_changes` webhook entry
- Or consolidate both into a single `discord-notify` function that handles all types

### Admin Panel UI:
- Show each webhook type as a card with: URL input, enabled toggle, message template textarea, and a variable legend

---

## Technical Implementation Order

### Phase 1: Database Migration
```sql
-- 1. Re-rank extra levels to fix duplicates
-- 2. Add UNIQUE constraint on extended_levels.rank_position
-- 3. Update calculate_points_for_rank() for new tiers (returns 0 for rank > 100)
-- 4. Recalculate all level points and player total_points
-- 5. Restructure webhook_settings table
-- 6. Seed new webhook type rows
```

### Phase 2: Config and Shared Code
- Update `src/config/levels.ts` with new `getPointsForRank()`

### Phase 3: Pages
- Update `src/pages/Index.tsx` to filter levels to rank <= 100
- Create `src/pages/ExtendedListPage.tsx` for levels rank > 100
- Update `src/pages/ExtraListPage.tsx` (no changes needed, already separate)
- Update `src/pages/GuidePage.tsx` with new descriptions and point tables
- Update `src/pages/LeaderboardPage.tsx` if needed

### Phase 4: Admin Panel
- Update `calculatePoints()` in `AdminPage.tsx`
- Update webhook settings UI to show per-type cards with template editing
- Add variable legend component

### Phase 5: Edge Functions
- Rewrite `discord-notify` to use DB-driven webhook URLs and templates
- Consolidate `admin-notify` into the same system

### Phase 6: Routing and Navigation
- Add `/extended-list` route in `App.tsx`
- Add "Extended List" to `Navbar.tsx`

---

## Files to Create
| File | Purpose |
|------|---------|
| `src/pages/ExtendedListPage.tsx` | New Extended List page (levels 101+) |
| SQL migration | Rank fix, point system, webhook schema |

## Files to Modify
| File | Changes |
|------|---------|
| `src/config/levels.ts` | New point tiers |
| `src/pages/AdminPage.tsx` | calculatePoints(), webhook UI overhaul |
| `src/pages/GuidePage.tsx` | Updated descriptions and point tables |
| `src/pages/Index.tsx` | Filter to rank <= 100 |
| `src/App.tsx` | Add /extended-list route |
| `src/components/Navbar.tsx` | Add Extended List nav item |
| `supabase/functions/discord-notify/index.ts` | Template-based messaging, DB-driven URLs |
| `supabase/functions/admin-notify/index.ts` | Consolidate with new webhook system |

