# Next Update: New Admin, Guide Refresh, Admin Panel Overhaul

## 1. Add M4zyxx as admin

M4zyxx (mazyx50@gmail.com) already has an account, currently with the normal user role. The update grants the admin role to that account, so they get full access to the Admin panel and admin-only actions.

Guide page: add M4zyxx to the Admins section of the "Created With Love" team card, alongside Ch4mpY and Ripted (profile pulled the same way as the others).

## 2. Guide page refresh

The guide still describes features that no longer exist. Changes:

- **Remove the whole "Community" tab** (level ratings, difficulty voting, "Who Can Vote?", tags) — community voting was removed from the site. Tab bar goes from 6 to 5 tabs.
- **FAQ cleanup**:
  - Remove "How do I rate or vote on the difficulty of a level?" (feature no longer exists).
  - Rewrite "How do creator points work?" — it currently says points depend on community ratings; the real rule is 1 point per Main-list level (plus the extra-list flat bonus as configured).
  - Fix the broken "Check recent runs" link (points at `/recent-runs`; the real route is `/recent`).
  - Update "Who decides level rankings?" to drop the community-voting implication.
  - Add new entries: what the Extra / Extended / Future lists each mean, how the Level Roulette works, and how to report a bug through the in-app bug report button.
- **Difficulty tab**: keep the D0–D8 scale explanation (still used), but remove references to community voting driving it.
- **Features tab**: verify every listed feature and link still exists (Packs, Roulette, Watchlist, Compare, Recently Added, Statistics) and fix any stale links.

## 3. Admin panel overhaul

Today the panel has 12 flat tabs: Submissions, Main, Future, Extra, Runs, Deleted, Players, Bans, Packs, Tag Presets, HTS Cup, Log.

### New structure — 5 tabs with sub-tabs

```text
Review              Lists              Players            Content         System
 - Submissions       - Main             - Players          - Packs         - HTS Cup
 - Claim requests    - Future           - Bans                             - Changelog
 - Run submissions   - Extra            - Deleted/Archive                  - Webhooks
                     - Manual runs      
                     - Deleted levels
```

Tag Presets is dropped from the panel since community tags were removed (only if nothing else still reads them — otherwise it moves under Content).

### Unify the three list tabs

The Main and Future tabs already share the same layout and controls; the Extra tab is a separate, inconsistent implementation. The update extracts one shared list-management component used by all three lists, so Extra gains everything Main/Future have:

- Same header, search, pagination / "Show All" toggle, and rank-shift confirm dialog
- Same row layout: thumbnail with paste-from-clipboard, multiple creators, verifier, alternative IDs, edit and delete
- Same add-level form with live level preview
- Same drag / rank editing behaviour (Future keeps its free-form ranks)

Per-list differences stay as options: Future has no rank normalisation, Extra uses the extra point table.

### Remove redundant buttons

- "Sync Completions" on the Extra list tab (completions already sync automatically every 3 minutes).
- Any duplicate resync buttons left over after unification — one "Resync All" per list.
- Audit the remaining action buttons and remove or relabel ones that no longer do anything meaningful.

## 4. Stop exposing user emails

Emails currently show in the admin UI wherever a submitter, banned user or admin actor is displayed. Change to show the player's username, with the email only where it's genuinely required.

- **Level submissions / run submissions**: show the submitter's Narrowlist username (resolved from their claimed profile), falling back to a masked email (`m•••@gmail.com`) only when no profile is linked.
- **Claim requests**: show the requested profile username; the email is the thing being verified, so keep it but only inside the review dialog, not in the list.
- **Manual runs / deleted archives / changelog**: show the acting admin's username instead of their email.
- **Bans**: ban by username in the UI; the underlying record can keep the email but the list displays the username.
- Log entries written by admin actions stop embedding submitter emails in their text.

## Technical notes

- Admin role granted through a database migration inserting the admin role for that user id (roles stay in the separate `user_roles` table).
- `AdminPage.tsx` is ~6100 lines; the overhaul splits it into `src/components/admin/` pieces: a shared `LevelListManager` used by Main/Future/Extra, plus per-section components for Review, Players, Content and System. Behaviour and data calls are preserved, not rewritten.
- Username resolution for submissions joins on the profile linked to the submitting user (via approved claim requests), computed once and reused across the panel.
- No changes to sync logic, point calculation, or webhooks.

## Out of scope

No changes to the public list pages, leaderboards, or scoring.
