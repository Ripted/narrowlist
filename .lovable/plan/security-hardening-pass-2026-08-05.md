# Security Hardening Pass

A full scan of the backend and frontend found several real issues, including three that expose real user email addresses to anonymous visitors and one that lets anyone on the internet trigger Discord posts. This plan fixes those first, then the medium and cosmetic issues.

## Critical: email addresses readable by anyone

Confirmed in the database: `level_submissions`, `run_submissions`, and `manual_runs` all have public read policies that expose email columns to anonymous API callers.

- `level_submissions.submitted_by_email` and `run_submissions.submitted_by_email`: restrict reads to the submitter and admins. Public-facing submission lists (if any) switch to a view that omits the email column.
- `manual_runs.added_by_admin_email`: manual runs must stay publicly readable (leaderboards depend on them), so public reads move to a view without the admin email column; the frontend reads the view, admins keep full table access.
- `discord_notifications`: currently world-readable internal tracking data with no public purpose. Restrict reads to admins.

## Critical: unauthenticated edge functions

All nine edge functions run with the service-role key and accept requests from anyone:
`sync-completions`, `sync-extra-completions`, `resync-main-levels`, `resync-future-levels`, `resync-extra-levels`, `hardfix-resync`, `discord-notify`, `admin-notify`, `hts-cup-check`.

Anyone with a URL can currently spam your Discord channels, force resyncs, or trigger `hardfix-resync`, which deletes profiles.

Fix:
- Admin-triggered functions (`hardfix-resync`, the three resync functions, `hts-cup-check`, `admin-notify`) verify the caller's login token and confirm the admin role before doing anything.
- Automated/background functions (`sync-completions`, `sync-extra-completions`, `discord-notify`) require a shared internal secret header, generated and stored in backend secrets.
- Frontend admin calls pass the user's session so those calls keep working.

## Critical: leaked Discord webhook URLs

Two Discord webhook URLs with their tokens are committed in old migration files, so they are permanently in the repo history and usable by anyone who reads it.

- You will need to delete and re-create both webhooks in Discord (I cannot do that for you), then save the new URLs as secrets.
- The migration files stay as-is (history cannot be rewritten safely), but the live values become worthless once rotated.
- Confirm no runtime code path still reads webhook URLs from the database table instead of secrets.

## High: stored XSS via profile links

`profiles.discord_url` / `tiktok_url` / `youtube_url` are only validated in the React form. Any logged-in user can call the API directly and store a `javascript:` link that runs code in another visitor's session when clicked.

- Add database CHECK constraints requiring `https?://` on all three columns.
- Add a render-time guard so a non-http(s) value is never turned into a clickable link.

## Medium hardening

- **Admin emails in the frontend bundle:** remove the hardcoded `ADMIN_EMAILS` list from `useAuth.tsx` and rely only on the database role check. The `is_head_admin` database function keeps its own separate check so head-admin powers are unaffected.
- **Leaked password protection:** enable the breached-password check on signup and password change.
- **Storage limits:** set the `profile-images` and `level-thumbnails` buckets to image-only MIME types and a 10 MB cap, enforced server-side rather than only in the upload form.
- **External API input validation:** the sync functions insert usernames, level names, thumbnails and completion times from `api.narrowarrow.xyz` with no checks. Add length/format/range validation before insert, plus matching database CHECK constraints.
- **SECURITY DEFINER execute grants:** the linter flags a large batch of functions callable by anonymous or ordinary signed-in users. Audit each one and revoke `EXECUTE` from `anon`/`authenticated` where only admins or triggers should call it.

## Minor / cosmetic

- Login page heading says "HARDEST LIST" — change to "NARROWLIST" to match the rest of the site.
- Sweep for any other stale branding strings while in there.

## Verification

- Re-run the security scan and database linter after the changes and confirm the error-level findings are gone.
- Sign-in, profile edit, submissions, admin level add/edit/delete, and the HTS Cup and completion webhooks all get exercised after the lockdown to make sure nothing legitimate broke.
- Confirm anonymous API reads of the submission and manual-run tables no longer return email columns.

## What I need from you

Rotating the two exposed Discord webhooks requires your Discord server access. Everything else I can do directly.
