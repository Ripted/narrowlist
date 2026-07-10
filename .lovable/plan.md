## Plan: deletion FK fix + embed webhook fix

### 1. Fix the actual profile deletion blocker
- Update the backend `admin_hard_delete_profile` function to handle every known profile reference before deleting the profile.
- Specifically fix the current error by either:
  - deleting `discord_notifications` rows for the profile before `profiles` is deleted, and
  - changing `discord_notifications.profile_id` to cascade on profile deletion so future delete paths cannot hit this again.
- Also review the remaining profile foreign keys found in the database:
  - `completions.profile_id` already cascades
  - `manual_runs.profile_id` already cascades
  - `extra_completions.profile_id` already cascades
  - `profile_claim_requests.profile_id` already cascades
  - `levels.verifier_profile_id` sets null
  - `extended_levels.verifier_profile_id` currently blocks deletes, so set verifier references to null during hard delete and make the FK non-blocking if needed.
- Preserve the existing archive/restore behavior: profile, runs, completions, claim requests, and watchlist are snapshotted before deletion and restorable.

### 2. Fix webhook URLs securely
- Store the provided URLs in backend secrets:
  - `DISCORD_WEBHOOK_COMPLETIONS`
  - `DISCORD_WEBHOOK_ADMIN`
- Do not hardcode the raw webhook URLs in frontend or edge function source.

### 3. Force embeds for all completion webhooks
- Keep `discord-notify` as the single completion notification path.
- Ensure every completion payload sends `{ embeds: [...] }`, never plain `content`.
- Fix the manual-run admin call site that currently omits `webhook_type`; that can make the function return `Unknown webhook_type` or fall back incorrectly.
- Completion embed will include:
  - arrow emoji
  - player name
  - level name
  - raw seconds completion time
  - list label
  - level link
  - level thumbnail

### 4. Force embeds for all admin-change webhooks
- Keep `admin-notify` delegating to `discord-notify` with `webhook_type: "rank_changes"`.
- Ensure all admin-change events use structured embed payloads only.
- Include level thumbnail, level ID, rank/list metadata, actor email when available, and a human-readable description per action type.

### 5. Deploy and verify backend functions
- Deploy the updated webhook functions after code changes.
- Test `discord-notify` directly with safe test payloads for:
  - one completion notification
  - one admin rank/change notification
- Check function logs if the test payloads fail.

### 6. Validate deletion flow
- Apply the database migration.
- Verify `discord_notifications_profile_id_fkey` no longer blocks profile deletion.
- Test the hard-delete function against a profile-shaped case with notification references, then confirm restore still re-creates archived profile data.