
# Comprehensive Extra List Parity and Stability Plan

## Overview
This plan addresses multiple interrelated issues to make the Extra List system fully equivalent to the Main List, fix completion sync issues, and add missing features.

---

## Issue Breakdown and Solutions

### 1. Extra List Admin Panel - Full Parity with Main List

**Current Problem:** The Extra List admin section lacks many features the Main List has (rank move buttons, proper rank shifting, tags, verifier/alternative IDs editing, etc.)

**Solution:**
- Add ChevronUp/ChevronDown move buttons for Extra List items (like Main List has)
- Add proper rank shifting logic when adding levels at a specific rank (currently creates duplicate ranks)
- Add verifier and alternative_ids fields to extended_levels editing modal
- Add tags support (using LevelTagAssigner component) for Extra List levels
- Add "Move to Main" button (already exists) and ensure all buttons match Main List UI

**Files to modify:**
- `src/pages/AdminPage.tsx` - Add move buttons, fix addExtendedLevel to shift ranks, add full edit modal with all fields

---

### 2. Extra List Completions Not Updating Automatically

**Current Problem:** The `sync-extra-completions` edge function exists but is never called automatically. New completions don't appear.

**Solution:**
- Create a scheduled invocation mechanism or add a "Sync Extra Completions" button in the admin panel (next to "Resync All")
- Add the sync to the "Sync Completions" button so both sync at once
- Alternatively, trigger sync-extra-completions from the hardfix button or add dedicated button

**Files to modify:**
- `src/pages/AdminPage.tsx` - Add "Sync Extra Completions" button that calls the edge function
- Consider adding this to the main sync flow

---

### 3. Player Username Changes in Profiles

**Current Problem:** When a player changes their in-game username, the profile username should update since the API reflects the new name via run_id matching.

**Solution:**
- The sync functions already handle this by matching run_id and updating the profile username
- Ensure both `sync-completions` and `sync-extra-completions` update the profile's username when detecting a name change via run_id
- Add the same logic to manual runs (when the same run_id is found with a different username)

**Files to verify/modify:**
- `supabase/functions/sync-completions/index.ts` - Already has username update logic
- `supabase/functions/sync-extra-completions/index.ts` - Already has username update logic
- Verify the logic is working correctly

---

### 4. Manual Runs Feature for Extra List

**Current Problem:** Manual runs only work for Main List levels. Extra List needs the same capability.

**Solution:**
- Create an `extra_manual_runs` table OR extend the `manual_runs` table with a `list_type` column
- Modify the manual run form to allow selecting Extra List levels
- Update the level selector dropdown to include extended_levels
- Add extra manual runs to the profile's Extra completions display

**Database changes:**
- Option A: Add `list_type` column to `manual_runs` (values: 'main', 'extra')
- Option B: Create separate `extra_manual_runs` table

**Files to modify:**
- `src/pages/AdminPage.tsx` - Modify manual run form to support Extra List
- `src/pages/PlayerPage.tsx` - Show extra manual runs in Extra tab
- Database migration for schema changes

---

### 5. Extra List Rank Management - Proper Shifting

**Current Problem:** Adding a level at rank 1 doesn't push other levels down; results in multiple rank 1s.

**Solution:**
- Implement the same rank shifting logic used for Main List in `addExtendedLevel`
- Before inserting, shift all levels with `rank_position >= targetRank` up by 1
- After deletion, re-rank remaining levels to close gaps
- Add `moveExtendedLevel` function for up/down buttons

**Files to modify:**
- `src/pages/AdminPage.tsx` - Fix `addExtendedLevel`, add `moveExtendedLevel`, add `deleteExtendedLevel` with re-ranking

---

### 6. Extra List Profile Completions - Match Main List UI

**Current Problem:** Extra tab in PlayerPage doesn't have search, sort, or "Show All" options like Main tab does.

**Solution:**
- Add the same controls to Extra tab: search input, sort toggle (rank/date), Show All/Paginate button
- Implement filtering, sorting, and pagination for extra completions
- Match the visual layout exactly

**Files to modify:**
- `src/pages/PlayerPage.tsx` - Add controls and logic to Extra tab content

---

### 7. Extra Points Leaderboard Podium

**Current Problem:** The Extra leaderboard tab doesn't have a top 3 podium display like the Players tab.

**Solution:**
- Add the same podium component to the Extra tab when there are 3+ players with extra points
- Show avatars, names, and extra points in the podium format

**Files to modify:**
- `src/pages/LeaderboardPage.tsx` - Add podium to Extra tab

---

### 8. Remove Hardfix Button Redundancy

**Current Problem:** User wants the system to work like Main List without needing a separate hardfix button.

**Solution:**
- Remove the standalone "Hardfix" button
- Integrate hardfix functionality into "Sync Extra Completions" button
- The sync should automatically clean up and recalculate points

**Files to modify:**
- `src/pages/AdminPage.tsx` - Remove hardfix button, merge functionality into sync
- Optionally keep a "Full Resync" that does everything

---

## Implementation Order

1. **Database Migration** - Add `list_type` to `manual_runs` table (or create extra_manual_runs)
2. **Admin Panel - Extra List Rank Management** - Fix rank shifting, add move buttons
3. **Admin Panel - Extra List Full Edit Modal** - Add verifier, alternative_ids, tags
4. **Admin Panel - Manual Runs for Extra List** - Modify form to support both lists
5. **Admin Panel - Sync Integration** - Add/integrate extra completion sync button
6. **Player Page - Extra Tab UI Parity** - Add search, sort, pagination
7. **Leaderboard Page - Extra Podium** - Add top 3 podium display
8. **Edge Functions - Verify Username Sync** - Ensure name changes propagate correctly
9. **Cleanup - Remove Hardfix Button** - Merge into unified sync

---

## Technical Details

### Database Schema Change
```sql
-- Add list_type to manual_runs to support Extra List
ALTER TABLE manual_runs ADD COLUMN list_type text NOT NULL DEFAULT 'main';

-- Update RLS policies if needed
```

### Admin Page Changes (Key Functions)

**New `moveExtendedLevel` function:**
```typescript
const moveExtendedLevel = async (currentIndex: number, direction: "up" | "down") => {
  // Similar to moveLevel but for extendedLevels
  // Swap rank positions and update both levels
};
```

**Fixed `addExtendedLevel` function:**
```typescript
const addExtendedLevel = async () => {
  // Before insert, shift ranks >= targetRank up by 1
  // Then insert at targetRank
  // Recalculate points using calculate_extra_points_for_rank
};
```

**New `deleteExtendedLevel` function:**
```typescript
const deleteExtendedLevel = async (level: ExtendedLevel) => {
  // Delete the level
  // Re-rank remaining levels to close gap
  // Recalculate points
};
```

### Player Page Extra Tab Enhancement

Add state for extra completions filtering:
```typescript
const [extraSearchQuery, setExtraSearchQuery] = useState("");
const [extraSortMode, setExtraSortMode] = useState<"rank" | "date">("rank");
const [extraShowAll, setExtraShowAll] = useState(false);
const [extraCurrentPage, setExtraCurrentPage] = useState(1);
```

### Leaderboard Extra Podium

Add conditional podium render in Extra tab:
```tsx
{!loadingExtraPoints && extraPointsPlayers.length >= 3 && !searchQuery && (
  <div className="hidden md:flex items-end justify-center gap-4 mb-8">
    {/* Second place */}
    {/* First place */}
    {/* Third place */}
  </div>
)}
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminPage.tsx` | Extra List rank management, move buttons, full edit modal, manual runs for extra, sync button, remove hardfix |
| `src/pages/PlayerPage.tsx` | Extra tab search/sort/pagination, extra manual runs display |
| `src/pages/LeaderboardPage.tsx` | Extra points podium |
| `supabase/functions/sync-extra-completions/index.ts` | Verify username sync logic |
| Database migration | Add `list_type` to `manual_runs` |

---

## Expected Outcomes

After implementation:
- Extra List admin management works identically to Main List
- Ranks shift properly when adding/moving levels
- Extra completions sync automatically with regular sync
- Players can see search, sort, and pagination in their Extra tab
- Manual runs can be added for Extra List levels
- Username changes propagate correctly through sync
- Extra leaderboard has a podium for top 3 players
