-- Functions to support Extra leaderboard hardfix + safe duplicate cleanup

CREATE OR REPLACE FUNCTION public.recalculate_all_extra_points()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles p
  SET extra_points = COALESCE((
    SELECT SUM(el.points)
    FROM public.extra_completions ec
    JOIN public.extended_levels el ON el.id = ec.level_id
    WHERE ec.profile_id = p.id
  ), 0);
$$;

CREATE OR REPLACE FUNCTION public.cleanup_empty_unclaimed_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.profiles p
  WHERE p.user_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.completions c WHERE c.profile_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.manual_runs m WHERE m.profile_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.extra_completions ec WHERE ec.profile_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.profile_claim_requests r WHERE r.profile_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.levels l WHERE l.verifier_profile_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.extended_levels el WHERE el.verifier_profile_id = p.id);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;