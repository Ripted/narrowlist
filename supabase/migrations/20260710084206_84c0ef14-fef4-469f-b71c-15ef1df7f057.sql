-- Fix profile hard-delete blockers and make notification profile references non-blocking
ALTER TABLE public.discord_notifications
  DROP CONSTRAINT IF EXISTS discord_notifications_profile_id_fkey;

ALTER TABLE public.discord_notifications
  ADD CONSTRAINT discord_notifications_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.extended_levels
  DROP CONSTRAINT IF EXISTS extended_levels_verifier_profile_id_fkey;

ALTER TABLE public.extended_levels
  ADD CONSTRAINT extended_levels_verifier_profile_id_fkey
  FOREIGN KEY (verifier_profile_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.admin_hard_delete_profile(_profile_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _archive_id UUID;
  _snapshot JSONB;
  _profile_row JSONB;
  _uname TEXT;
  _uid UUID;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT to_jsonb(p.*), p.username, p.user_id INTO _profile_row, _uname, _uid
  FROM public.profiles p WHERE p.id = _profile_id;

  IF _profile_row IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  _snapshot := jsonb_build_object(
    'profile', _profile_row,
    'completions', COALESCE((SELECT jsonb_agg(to_jsonb(c.*)) FROM public.completions c WHERE c.profile_id = _profile_id), '[]'::jsonb),
    'manual_runs', COALESCE((SELECT jsonb_agg(to_jsonb(m.*)) FROM public.manual_runs m WHERE m.profile_id = _profile_id), '[]'::jsonb),
    'extra_completions', COALESCE((SELECT jsonb_agg(to_jsonb(ec.*)) FROM public.extra_completions ec WHERE ec.profile_id = _profile_id), '[]'::jsonb),
    'discord_notifications', COALESCE((SELECT jsonb_agg(to_jsonb(dn.*)) FROM public.discord_notifications dn WHERE dn.profile_id = _profile_id), '[]'::jsonb),
    'claim_requests', COALESCE((SELECT jsonb_agg(to_jsonb(r.*)) FROM public.profile_claim_requests r WHERE r.profile_id = _profile_id), '[]'::jsonb),
    'watchlist', CASE
      WHEN _uid IS NULL THEN '[]'::jsonb
      ELSE COALESCE((SELECT jsonb_agg(to_jsonb(w.*)) FROM public.user_watchlist w WHERE w.user_id = _uid), '[]'::jsonb)
    END
  );

  INSERT INTO public.deleted_profiles_archive (original_profile_id, username, snapshot, deleted_by, deleted_by_email)
  VALUES (_profile_id, _uname, _snapshot, auth.uid(),
    COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system'))
  RETURNING id INTO _archive_id;

  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_watchlist WHERE user_id = _uid;
  END IF;

  UPDATE public.levels SET verifier_profile_id = NULL WHERE verifier_profile_id = _profile_id;
  UPDATE public.extended_levels SET verifier_profile_id = NULL WHERE verifier_profile_id = _profile_id;

  DELETE FROM public.discord_notifications WHERE profile_id = _profile_id;
  DELETE FROM public.profile_claim_requests WHERE profile_id = _profile_id;
  DELETE FROM public.extra_completions WHERE profile_id = _profile_id;
  DELETE FROM public.manual_runs WHERE profile_id = _profile_id;
  DELETE FROM public.completions WHERE profile_id = _profile_id;
  DELETE FROM public.profiles WHERE id = _profile_id;

  RETURN _archive_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_restore_profile(_archive_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    bio, extra_points, total_points, created_at, updated_at,
    discord_url, tiktok_url, youtube_url
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
    now(),
    _profile->>'discord_url',
    _profile->>'tiktok_url',
    _profile->>'youtube_url'
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO _new_profile_id;

  IF _new_profile_id IS NULL THEN
    _new_profile_id := (_profile->>'id')::uuid;
  END IF;

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

  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'discord_notifications','[]'::jsonb)) LOOP
    INSERT INTO public.discord_notifications
    SELECT * FROM jsonb_populate_record(NULL::public.discord_notifications, _row)
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
$function$;