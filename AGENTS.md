# Narrowlist — old-site takeover page

- This repo (`Ripted/narrowlist`) is the OLD site (legacy-narrowlist.lovable.app). It is no longer the real app.
- The real app now lives at `narrowlist.net`, hosted from the separate private repo `sqmyou/Narrowlist`.
- This repo was gutted: the entire old app (pages, components, hooks, config, integrations, supabase) was deleted.
- It now renders ONE static "We have moved." takeover page: a disclaimer + a button linking to `https://narrowlist.net`. All old routes/features are gone.
- Kept source: `src/main.tsx`, `src/index.css` (the full theme), `src/App.tsx` (the takeover page), `src/assets/logo.png`.
- To change the redirect target, edit `NEW_SITE_URL` at the top of `src/App.tsx`. To enable auto-redirect, set `AUTO_REDIRECT_SECONDS` there (0 = button only).
- Supabase still sends email confirmations/password resets to this domain's `/auth/v1/verify…` path (it remains the dashboard's Site URL). `src/App.tsx` detects those auth paths and forwards them (query intact) to the Supabase GoTrue backend (`SUPABASE_AUTH_BASE_URL`)so tokens get validated and redirected to the new site. Keep `SUPABASE_AUTH_PATHS` in sync with any GoTrue callback paths the project uses., and keep `SUPABASE_AUTH_BASE_URL` pointing at the project's auth host。
- Theme/CSS lives in `src/index.css` (Tailwind + CSS variables) — keep the same look.
- Build: `npm run build` (vite). Typecheck separately: `npx tsc --noEmit -p tsconfig.app.json`.
