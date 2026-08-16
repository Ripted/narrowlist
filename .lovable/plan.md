# Minor Update: Navigation, Roulette, Public API, Guide & Stats

## 1. Legal pages navigation + header clipping

- Add Privacy Policy and Terms of Use into the navbar (under the "Tools" group on desktop, and as a small "Legal" section in the mobile sheet) so they aren't footer-only.
- Expand the footer into a proper multi-link row (Privacy, Terms, Guide, Discord, plus a short copyright line).
- Fix the clipped site title: the `.gradient-text` utility uses background-clip on text, which crops descenders and glyph edges. It gets `display: inline-block`, a slightly relaxed `line-height`, and a small horizontal padding so "NARROWLIST" and every gradient heading render fully. Also allow the header logo/title block to shrink gracefully on very narrow screens instead of being cut off.

## 2. Level Roulette rework

Current bugs found in the page:

- On first load the level data hasn't arrived yet, so the "max available rank" is computed as `1` and the clamp effect immediately forces **Min/Max rank to 1** — the reported "stupid defaults" bug. The clamp will only run once real data exists.
- Settings are lost on every reload (nothing is persisted).
- A run can be started with fewer eligible levels than requested with no warning.
- "Skip" silently does nothing at 0 skips left; the level is never revisited.
- Give up mid-run loses the pending levels' state and the summary counts them as neither.

Rework:

- **Defaults**: 10 levels, 2 skips, rank range = full range of the enabled lists (auto-fills once data loads).
- **Persist settings** (level count, skips, rank range, list toggles, new options) in localStorage alongside saved runs, plus an in-progress run so a refresh doesn't destroy it.
- **More customization**:
  - Include/exclude Main, Extended, Extra and Future lists (currently only Main + Extra).
  - Rank range with a dual slider *and* number inputs, clamped to real list size.
  - Option to exclude levels you've already completed (uses your linked profile when signed in).
  - Difficulty weighting: uniform random (default) or weighted toward harder/easier ranks.
  - Optional "no duplicates across saved runs" and a seed field so a run can be shared/replayed.
- **Better run UX**: progress bar, skip counter that disables clearly, "Skip" moves the level to the end when skips remain (configurable: discard vs. requeue), undo last action, and a full run list with per-level status visible during the run.
- **Better summary**: completion rate, total points of completed levels, hardest level completed, time taken, and pending levels correctly labelled when giving up.
- **Saved runs**: keep per-run delete and expandable details, add aggregate lifetime stats (runs played, levels completed, best run, favourite rank range).

## 3. Public API

Two read-only public endpoints served as backend edge functions with open CORS and no login required:

- `GET /public-api/main-list` — rank, level id, name, creators, points, thumbnail, verifier, added date.
- `GET /public-api/future-list` — same shape for the future list.
- Query params: `?limit=`, `?offset=`, `?rank_min=`, `?rank_max=`, `?format=json` (default).
- Light rate limiting per IP and short-lived caching headers so the endpoints can't be hammered.
- A short "Public API" section on the Guide page documenting the URLs, params and an example response.

Difficulty: **low**. The data is already public and read-only, so this is one small function plus docs. Extending it later to leaderboards/profiles is easy.

## 4. Discord bot — feasibility feedback (no code this update)

A 24/7 bot cannot run inside this project: the site is a static frontend plus on-demand serverless functions, and neither keeps a persistent gateway connection to Discord.

Two workable routes:

- **Slash-command-only bot via HTTP interactions** — Discord posts each command to a webhook URL, which can be a backend edge function here. No always-on host needed, works for `/list`, `/level`, `/leaderboard`, `/profile`, `/random`. Response must be sent within 3 seconds (deferred replies allowed). This is the recommended path and is genuinely doable, roughly a medium-sized task.
- **Full gateway bot** (presence, message events, reactions) — needs a small always-on host elsewhere (a cheap VPS or a container host). Code is simple; the hosting is the cost. It would consume the public API above.

Either way, building the public API first is the right sequencing.

## 5. Guide update

- Add the Public API section (endpoints, params, example).
- Rewrite the Level Roulette entry to describe the new options.
- Sweep remaining outdated wording (removed community voting/ratings references, correct route links) and refresh the FAQ answers that changed.
- Add a short "Legal" pointer to Privacy/Terms.

## 6. Statistics page improvements

- Tidy the layout into clear sections (Overview → Players → Levels → Activity) instead of one long scroll of mixed cards.
- Fix chart readability: consistent theme colors, axis labels, tooltip formatting, and empty-state placeholders instead of blank charts.
- Add a list filter (Main / Extended / Extra) applying to the level-based charts.
- Add a few genuinely useful stats: completions over time, points distribution, most active players this month, average completions per level.
- Mobile: keep every chart readable at 390px, legends below charts, no horizontal scroll.

## Technical notes

- Roulette state moves into a single persisted settings object with a version key so old localStorage entries don't break it.
- The clamp effect gets guarded on data-loaded so the min/max reset bug can't reappear.
- Public API is a new edge function with public access and CORS headers; it only reads already-public tables.
- No schema changes are required for this update.
