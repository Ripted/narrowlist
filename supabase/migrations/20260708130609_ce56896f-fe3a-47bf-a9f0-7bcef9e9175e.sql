
-- 1) Archive table for hard-deleted profiles (30-day restore window, but manually purge is available)
CREATE TABLE IF NOT EXISTS public.deleted_profiles_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_profile_id UUID NOT NULL,
  username TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  deleted_by UUID,
  deleted_by_email TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deleted_profiles_archive TO authenticated;
GRANT ALL ON public.deleted_profiles_archive TO service_role;

ALTER TABLE public.deleted_profiles_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view archive" ON public.deleted_profiles_archive;
CREATE POLICY "Admins can view archive"
  ON public.deleted_profiles_archive FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can modify archive" ON public.deleted_profiles_archive;
CREATE POLICY "Admins can modify archive"
  ON public.deleted_profiles_archive FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()));

-- 2) Hard delete a profile + all their runs, snapshot to archive first
CREATE OR REPLACE FUNCTION public.admin_hard_delete_profile(_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _archive_id UUID;
  _snapshot JSONB;
  _profile_row JSONB;
  _uname TEXT;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT to_jsonb(p.*), p.username INTO _profile_row, _uname
  FROM public.profiles p WHERE p.id = _profile_id;

  IF _profile_row IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  _snapshot := jsonb_build_object(
    'profile', _profile_row,
    'completions', COALESCE((SELECT jsonb_agg(to_jsonb(c.*)) FROM public.completions c WHERE c.profile_id = _profile_id), '[]'::jsonb),
    'manual_runs', COALESCE((SELECT jsonb_agg(to_jsonb(m.*)) FROM public.manual_runs m WHERE m.profile_id = _profile_id), '[]'::jsonb),
    'extra_completions', COALESCE((SELECT jsonb_agg(to_jsonb(ec.*)) FROM public.extra_completions ec WHERE ec.profile_id = _profile_id), '[]'::jsonb),
    'claim_requests', COALESCE((SELECT jsonb_agg(to_jsonb(r.*)) FROM public.profile_claim_requests r WHERE r.profile_id = _profile_id), '[]'::jsonb),
    'watchlist', COALESCE((SELECT jsonb_agg(to_jsonb(w.*)) FROM public.user_watchlist w WHERE w.profile_id = _profile_id), '[]'::jsonb)
  );

  INSERT INTO public.deleted_profiles_archive (original_profile_id, username, snapshot, deleted_by, deleted_by_email)
  VALUES (_profile_id, _uname, _snapshot, auth.uid(),
    COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'))
  RETURNING id INTO _archive_id;

  -- delete dependent rows (in safe order)
  DELETE FROM public.user_watchlist WHERE profile_id = _profile_id;
  DELETE FROM public.profile_claim_requests WHERE profile_id = _profile_id;
  DELETE FROM public.extra_completions WHERE profile_id = _profile_id;
  DELETE FROM public.manual_runs WHERE profile_id = _profile_id;
  DELETE FROM public.completions WHERE profile_id = _profile_id;
  -- do not null verifier refs on levels; keep verification intact
  DELETE FROM public.profiles WHERE id = _profile_id;

  RETURN _archive_id;
END;
$$;

-- 3) Restore from archive
CREATE OR REPLACE FUNCTION public.admin_restore_profile(_archive_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _snap JSONB;
  _profile JSONB;
  _new_profile_id UUID;
  _row JSONB;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT snapshot INTO _snap FROM public.deleted_profiles_archive
  WHERE id = _archive_id AND restored_at IS NULL;

  IF _snap IS NULL THEN
    RAISE EXCEPTION 'Archive not found or already restored';
  END IF;

  _profile := _snap->'profile';

  INSERT INTO public.profiles (
    id, username, display_name, user_id, country_code, avatar_url, banner_url,
    bio, extra_points, total_points, created_at, updated_at
  )
  VALUES (
    (_profile->>'id')::uuid,
    _profile->>'username',
    _profile->>'display_name',
    NULLIF(_profile->>'user_id','')::uuid,
    _profile->>'country_code',
    _profile->>'avatar_url',
    _profile->>'banner_url',
    _profile->>'bio',
    COALESCE((_profile->>'extra_points')::int, 0),
    COALESCE((_profile->>'total_points')::int, 0),
    COALESCE((_profile->>'created_at')::timestamptz, now()),
    now()
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO _new_profile_id;

  IF _new_profile_id IS NULL THEN
    _new_profile_id := (_profile->>'id')::uuid;
  END IF;

  -- restore completions
  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'completions','[]'::jsonb)) LOOP
    INSERT INTO public.completions
    SELECT * FROM jsonb_populate_record(NULL::public.completions, _row)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'manual_runs','[]'::jsonb)) LOOP
    INSERT INTO public.manual_runs
    SELECT * FROM jsonb_populate_record(NULL::public.manual_runs, _row)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'extra_completions','[]'::jsonb)) LOOP
    INSERT INTO public.extra_completions
    SELECT * FROM jsonb_populate_record(NULL::public.extra_completions, _row)
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'watchlist','[]'::jsonb)) LOOP
    INSERT INTO public.user_watchlist
    SELECT * FROM jsonb_populate_record(NULL::public.user_watchlist, _row)
    ON CONFLICT DO NOTHING;
  END LOOP;

  UPDATE public.deleted_profiles_archive SET restored_at = now() WHERE id = _archive_id;

  PERFORM public.recalculate_player_points(_new_profile_id);
  PERFORM public.recalculate_player_extra_points(_new_profile_id);

  RETURN _new_profile_id;
END;
$$;
