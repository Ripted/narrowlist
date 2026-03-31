

# Bug Fix Plan

## Bugs Identified

### 1. Webhook Settings Save on Every Keystroke
**File:** `src/pages/AdminPage.tsx` (lines 4206-4211, 4216-4221)
**Bug:** The webhook URL and template `onChange` handlers call `updateWebhookSetting()` on every keystroke, firing a Supabase update per character typed. This causes rapid API calls, poor UX, and potential data loss.
**Fix:** Convert webhook settings to use local state per webhook card, with a dedicated "Save" button. Store edits locally, only persist on explicit save.

### 2. Main List Edit Modal Missing Verifier Field
**File:** `src/pages/AdminPage.tsx` (lines 4560-4671)
**Bug:** The main list edit modal lacks a Verifier dropdown selector. The extra list edit modal has one, but the main list does not. Also, `saveEditedLevel()` (line 2234) does not update `verifier_profile_id`.
**Fix:** Add a Verifier `<Select>` field to the main list edit modal (matching the extra list pattern with `"none"` sentinel). Update `saveEditedLevel()` to include `verifier_profile_id` in the update payload.

### 3. `resync-future-levels` Still Overwrites Manual Edits
**File:** `supabase/functions/resync-future-levels/index.ts` (lines 59-65)
**Bug:** Unlike `resync-main-levels` and `resync-extra-levels` which were already fixed to only update `name`/`author` when NULL, the future levels resync still overwrites any name/author that differs from the API.
**Fix:** Apply the same pattern: only update `name` if `level.name` is NULL, only update `author` if `level.author` is NULL.

### 4. `discord-notify` Missing `webhook_type` for Run Submissions
**File:** `src/pages/AdminPage.tsx` (lines 978-991)
**Bug:** When approving a run submission, the Discord notification call uses `completion_type: "manual_run"` but does not include `webhook_type`. The `discord-notify` function requires `webhook_type` to look up the correct webhook settings.
**Fix:** Add `webhook_type: 'main_completions'` (or determine based on level rank) to the `discord-notify` invocation for run submission approvals.

### 5. Extra List Rank Re-ranking Not Applied (UNIQUE constraint may be blocking)
**Bug:** The previous migration attempted to re-rank `extended_levels`, but with a UNIQUE constraint on `rank_position`, sequential updates can conflict if intermediate values collide with existing values. The duplicate ranks may still exist.
**Fix:** SQL migration that temporarily drops the UNIQUE constraint, re-ranks all levels, then re-adds the constraint.

### 6. `deleteExtendedLevel` Does Not Re-rank Remaining Levels
**File:** `src/pages/AdminPage.tsx` (lines 702-718)
**Bug:** When deleting an extra level, remaining levels are not re-ranked, creating gaps (e.g., deleting #3 leaves ranks 1, 2, 4, 5...). Main list `confirmDeleteLevel` does re-rank.
**Fix:** After deleting, fetch remaining extended levels, re-rank them sequentially, and update the database.

### 7. Console Errors: "Error fetching level details: Load failed"
**Bug:** The Index/Extra pages fire many parallel API calls to `api.narrowarrow.xyz` which fail (likely rate limiting or CORS). These are non-blocking but pollute the console.
**Fix:** Add error handling/retry logic and rate limit the batch fetches in `ExtraListPage.tsx` and `useLevels.ts` using smaller batch sizes and delays.

---

## Implementation Order

1. **SQL Migration** - Fix extra list duplicate ranks (drop constraint, re-rank, re-add)
2. **Webhook UI** - Convert to local state with explicit Save button
3. **Main List Edit Modal** - Add Verifier field and update save logic
4. **Resync Future Levels** - Prevent name/author overwrite
5. **Run Submission Webhook** - Add `webhook_type` to discord-notify call
6. **Delete Extra Level** - Add re-ranking after deletion
7. **Console Errors** - Add batch rate limiting for API calls

## Files to Modify

| File | Changes |
|------|---------|
| SQL migration | Re-rank extended_levels safely |
| `src/pages/AdminPage.tsx` | Webhook local state + save button, add verifier to main edit modal, fix run submission webhook call, re-rank after extra delete |
| `supabase/functions/resync-future-levels/index.ts` | Only update name/author when NULL |
| `src/pages/ExtraListPage.tsx` | Batch API calls with delays |

