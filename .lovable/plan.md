
# Bug Fixes + Future List Redesign + Level Packs + Victor Counts

## 1. Fix "Is this you?" RLS error (creator-only profiles)

**Problem:** `handleClaimProfile` tries to `INSERT` into `profiles` with `{ username, extra_points: 0 }` but no `user_id`. The RLS policy `Users can insert own profile` requires `auth.uid() = user_id`, so insert fails for creator-only profiles where no profile row exists yet.

**Fix:** Move profile creation server-side via a new SECURITY DEFINER RPC `claim_or_create_profile(_username text)` that:
- Looks up profile by username (case-insensitive)
- If none exists, creates one with `user_id = NULL` (server bypasses RLS)
- Inserts a row in `profile_claim_requests` for the calling user
- Returns the profile id

`PlayerPage.handleClaimProfile` calls the RPC instead of two separate inserts.

## 2. "Is this you?" for logged-out users

**Fix:** Update `canClaim` in `PlayerPage.tsx` so the button always renders for unclaimed/special profiles. When `!user`, change handler to redirect to `/auth?redirect=/player/{username}` and show a toast "Sign in to claim this profile".

## 3. Show creator points on creator/player page

**Problem:** Creator points only appear in the Leaderboard's Creators tab via `useAllRatingsAggregate` formula `Σ (avg_rating / 10) × base_points`. Player page shows raw `createdLevelsTotalPoints` (sum of `points`).

**Fix:** In `PlayerPage.tsx`, import `useAllRatingsAggregate`, compute per-creator points using the same formula across `createdLevels`, and display as "Creator Points" with the rating-weighted value. Also show under stats when `player` exists (currently only shows when no player).

## 4. Future List redesign with level cards

**Fix:** Rewrite `FutureListPage.tsx` to use a card grid (matching Index/Main list layout) instead of a flat list. Each card shows:
- Large thumbnail
- Level name + author/creators
- "~#rank" badge
- Like count (fetched from external API via `fetchLevelDetails`, cached)
- Created date (`created_at` from `future_levels`)
- Play + copy ID buttons

Use `LevelCard` component pattern, but with a `FutureLevelCard` variant that shows the date instead of points (future levels aren't ranked for points). Reuse the API-batched fetch pattern (5 at a time, 200ms delay) from existing list pages.

## 5. New "Level Packs" admin tab

**DB migration:**
- Table `level_packs` (id, name text, description text, cover_url text, created_by uuid, created_at, updated_at)
- Table `level_pack_items` (id, pack_id fk, level_id uuid, level_type text 'main'|'extended', display_order int)
- RLS: public SELECT, admin-only ALL on both
- Unique constraint on (pack_id, level_id, level_type)

**UI:**
- New `src/components/admin/LevelPacksManager.tsx` with create/edit/delete pack flow
- Pack editor: name + description inputs, searchable level picker (main + extra), drag/reorder items, save
- Add tab in `AdminPage.tsx` TabsList: `<TabsTrigger value="packs">Level Packs</TabsTrigger>`
- Add `<TabsContent value="packs">` rendering the manager

**Public page (lightweight):** new `/packs` route + `PacksPage.tsx` listing all packs as cards; clicking opens a detail view showing the levels in the pack. Add nav entry in Navbar "More" dropdown.

## 6. Victor count on level cards

**Approach:** Compute completion counts per level in a single aggregate query and pass into cards.

**Hook:** New `src/hooks/useLevelCompletionCounts.ts` using React Query (5-min stale):
- Fetches all rows from `completions` (level_id only) + `manual_runs` (level_id, list_type='main') + `extra_completions` + extra manual runs
- Returns `Map<levelDbId, count>` deduplicated per profile per level

**UI:** Add a small badge on `LevelCard.tsx` (and the Extra list custom card): `<Users icon /> {count}` with tooltip "Victors". Pass `victorCount` prop from `Index.tsx`, `ExtendedListPage.tsx`, `ExtraListPage.tsx`.

## 7. Other bugs found during exploration

- **Console spam**: `Error fetching level details: Failed to fetch` on Index — silence non-critical errors in the API batch fetch (already partially throttled per memory). Wrap in try/catch and only log once per batch failure.
- **`profile_claim_requests` duplicate**: current code only catches `23505` after creating profile — if profile creation succeeds but claim fails, an orphan profile remains. The new RPC handles both atomically.

## Technical Details

| File | Change |
|------|--------|
| SQL migration | Add `level_packs`, `level_pack_items` tables + RLS; add `claim_or_create_profile` RPC |
| `src/pages/PlayerPage.tsx` | Use new RPC for claim; logged-out claim → redirect to /auth; show rating-weighted creator points |
| `src/pages/FutureListPage.tsx` | Rewrite with card grid + API enrichment for like counts |
| `src/components/FutureLevelCard.tsx` | New card component for future levels |
| `src/components/LevelCard.tsx` | Add `victorCount` prop + Users icon badge |
| `src/pages/ExtraListPage.tsx` | Pass victor counts to its custom card |
| `src/pages/Index.tsx`, `ExtendedListPage.tsx` | Pass victor counts |
| `src/hooks/useLevelCompletionCounts.ts` | New aggregation hook |
| `src/components/admin/LevelPacksManager.tsx` | New admin component |
| `src/pages/AdminPage.tsx` | Add "Level Packs" tab + content |
| `src/pages/PacksPage.tsx` | New public page |
| `src/components/Navbar.tsx` | Add "Packs" link to More menu |
| `src/App.tsx` | Add `/packs` route |
| `src/lib/api.ts` (or fetch helper) | Suppress repetitive fetch error logs |

## Implementation Order

1. SQL migration (tables + RPC)
2. Fix RLS claim flow + logged-out claim handler
3. Creator points on player page
4. Victor count hook + LevelCard badge + integration into all list pages
5. Future List redesign
6. Level Packs admin manager + public page + nav
7. Console error suppression
