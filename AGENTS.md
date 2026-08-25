# Narrowlist — repo notes

- Stack: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase (auth, Postgres with RLS) + TanStack Query. Package manager: npm (bun.lock also present).
- `npm run build` only runs `vite build` — it does NOT typecheck. Run `npx tsc --noEmit -p tsconfig.app.json` separately.
- Pre-existing tsc errors (unrelated to new work): `src/pages/LevelPage.tsx` (~line 375), `src/pages/admin/tabs/RatersTab.tsx` (~line 81).
- Database changes go in `supabase/migrations/<timestamp>_<name>.sql`; apply them to the Supabase project separately (no local DB here). Conventions: RLS enabled on every table, `public.has_role(auth.uid(), 'admin'::app_role)` for admin checks, `update_updated_at_column()` trigger for `updated_at`.
- After adding tables, hand-edit `src/integrations/supabase/types.ts` (generated-style, alphabetically ordered tables) so typed queries compile.
- Events/jams are hardcoded in `src/config/events.ts` (no admin page). The SQL time windows in the jam migration (`jam_submission_open`, `jam_voting_open`) must stay in sync with that config.
- Dev server: `server.allowedHosts` in `vite.config.ts` includes `.prod-runtime.all-hands.dev` so the work-host previews work. The real brand logo is `src/assets/logo.png` (also used by Navbar) — use it instead of generic icons for branding.
