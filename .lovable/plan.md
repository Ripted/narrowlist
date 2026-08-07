# Slim Down the Navigation

The app currently exposes 17+ destinations (4 main nav items, an Admin item, and 12 items in "More", mirrored on the Hub). The goal is to reduce this to a small, stable set of top-level tabs by merging closely related pages into tabbed sub-views, without deleting any functionality.

## Proposed structure

Top-level navigation (5 items + Admin):

```text
Lists        Leaderboards     Activity        Tools        Explore
 - Main       - Players        - Recent Runs   - Submit      (hub grid)
 - Extended   - Creators       - Recently      - Guide
 - Extra      - Compare          Added         - Themes
 - Future                      - Statistics    - Roulette
 - Packs                                       - Watchlist
                                               - Profile
```

## Merges

1. **Lists** (`/list`, default Main): Main, Extended, Extra, Future, Packs become tabs on one page. Old URLs (`/main`, `/extra-list`, `/future-list`, `/extended-list`, `/packs`) redirect to the matching tab so existing links keep working.
2. **Leaderboards** (`/leaderboard`): Players, Creators, and Compare Players as tabs.
3. **Activity** (`/activity`): Recent Runs, Recently Added, and Statistics as tabs.
4. **Tools** (`/tools`): Submit, Guide, Themes, Level Roulette, plus Watchlist and My Profile links when signed in. Roulette stays a full feature, just no longer a top-level tab.
5. **Explore/Hub** stays as the visual index, regrouped to match the five sections above.

Result: the "More" dropdown disappears entirely, and the mobile sidebar fits on screen without scrolling.

## Technical notes

- Add a shared `PageTabs` component (shadcn Tabs styled as segmented nav) used by the four merged shells; tab state driven by the URL (`/list/extra`) so tabs stay linkable and back/forward works.
- Keep every existing page component intact; the shells render them as tab panels. No changes to data fetching, hooks, or backend.
- Add `<Route>` redirects for all legacy paths so bookmarks, Discord embeds, and webhook links don't break.
- Update `Navbar.tsx` (desktop + mobile sheet) and `HubPage.tsx` to the new five-section model; active-state logic switches from exact path match to path-prefix match.
- Level detail (`/level/:id`) and player pages (`/player/:username`) stay as standalone routes.

## Out of scope

No pages are removed and no features change behaviour — this is purely navigation restructuring.
