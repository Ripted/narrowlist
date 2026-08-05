-- 1. Profile URL constraints (strip bad values first)
UPDATE public.profiles SET discord_url = NULL WHERE discord_url IS NOT NULL AND discord_url !~* '^https?://';
UPDATE public.profiles SET tiktok_url = NULL WHERE tiktok_url IS NOT NULL AND tiktok_url !~* '^https?://';
UPDATE public.profiles SET youtube_url = NULL WHERE youtube_url IS NOT NULL AND youtube_url !~* '^https?://';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_discord_url_scheme CHECK (discord_url IS NULL OR discord_url ~* '^https?://'),
  ADD CONSTRAINT profiles_tiktok_url_scheme CHECK (tiktok_url IS NULL OR tiktok_url ~* '^https?://'),
  ADD CONSTRAINT profiles_youtube_url_scheme CHECK (youtube_url IS NULL OR youtube_url ~* '^https?://');

-- 2. manual_runs: restrict base table, expose email-free view
DROP POLICY IF EXISTS "Manual runs are viewable by everyone" ON public.manual_runs;
CREATE POLICY "Admins can view manual runs"
  ON public.manual_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_head_admin(auth.uid()));

CREATE OR REPLACE VIEW public.manual_runs_public AS
  SELECT id, level_id, profile_id, completion_time, arrow_name, is_verifier,
         completed_at, note, proof_url, list_type, created_at, updated_at
  FROM public.manual_runs;
GRANT SELECT ON public.manual_runs_public TO anon, authenticated;

-- 3. level_submissions: restrict base table, expose email-free view
DROP POLICY IF EXISTS "Anyone can view submissions" ON public.level_submissions;
CREATE POLICY "Admins and submitters view level submissions"
  ON public.level_submissions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_head_admin(auth.uid())
    OR auth.uid() = submitted_by
  );

CREATE OR REPLACE VIEW public.level_submissions_public AS
  SELECT id, level_id, level_name, author, thumbnail_url, suggested_rank, final_rank,
         status, target_list, approved_list, created_at, reviewed_at
  FROM public.level_submissions;
GRANT SELECT ON public.level_submissions_public TO anon, authenticated;

-- 4. run_submissions: restrict base table, expose email-free view
DROP POLICY IF EXISTS "Anyone can view run submissions" ON public.run_submissions;
CREATE POLICY "Admins and submitters view run submissions"
  ON public.run_submissions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_head_admin(auth.uid())
    OR auth.uid() = submitted_by
  );

CREATE OR REPLACE VIEW public.run_submissions_public AS
  SELECT id, level_id, level_name, username, is_verifier, proof_url,
         status, created_at, reviewed_at
  FROM public.run_submissions;
GRANT SELECT ON public.run_submissions_public TO anon, authenticated;

-- 5. discord_notifications: admin-only reads
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.discord_notifications;
CREATE POLICY "Admins can view notifications"
  ON public.discord_notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_head_admin(auth.uid()));

-- 6. Lock admin-only RPCs away from anonymous callers
REVOKE ALL ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hard_delete_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_restore_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.normalize_level_ranks(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_empty_unclaimed_profiles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalculate_all_extra_points() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalculate_player_points(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalculate_player_extra_points(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_hard_delete_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_restore_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_empty_unclaimed_profiles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_all_extra_points() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_player_points(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_player_extra_points(uuid) TO authenticated, service_role;