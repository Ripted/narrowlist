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

  FOR _row IN SELECT * FROM jsonb_array_elements(COALESCE(_snap->'claim_requests','[]'::jsonb)) LOOP
    INSERT INTO public.profile_claim_requests
    SELECT * FROM jsonb_populate_record(NULL::public.profile_claim_requests, _row)
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