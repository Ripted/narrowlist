CREATE OR REPLACE FUNCTION public.normalize_level_ranks(_list_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()) OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF _list_type = 'main' THEN
    WITH ordered AS (
      SELECT id, row_number() OVER (ORDER BY rank_position ASC, created_at ASC, id ASC)::int AS new_rank
      FROM public.levels
    )
    UPDATE public.levels l
    SET rank_position = -ordered.new_rank,
        points = public.calculate_points_for_rank(ordered.new_rank)
    FROM ordered
    WHERE l.id = ordered.id;

    UPDATE public.levels
    SET rank_position = -rank_position,
        points = public.calculate_points_for_rank(-rank_position)
    WHERE rank_position < 0;
  ELSIF _list_type = 'extra' THEN
    WITH ordered AS (
      SELECT id, row_number() OVER (ORDER BY rank_position ASC, created_at ASC, id ASC)::int AS new_rank
      FROM public.extended_levels
    )
    UPDATE public.extended_levels el
    SET rank_position = -ordered.new_rank,
        points = public.calculate_extra_points_for_rank(ordered.new_rank)
    FROM ordered
    WHERE el.id = ordered.id;

    UPDATE public.extended_levels
    SET rank_position = -rank_position,
        points = public.calculate_extra_points_for_rank(-rank_position)
    WHERE rank_position < 0;
  ELSIF _list_type = 'future' THEN
    WITH ordered AS (
      SELECT id, row_number() OVER (ORDER BY rank_position ASC, created_at ASC, id ASC)::int AS new_rank
      FROM public.future_levels
    )
    UPDATE public.future_levels fl
    SET rank_position = -ordered.new_rank,
        points = public.calculate_points_for_rank(ordered.new_rank)
    FROM ordered
    WHERE fl.id = ordered.id;

    UPDATE public.future_levels
    SET rank_position = -rank_position,
        points = public.calculate_points_for_rank(-rank_position)
    WHERE rank_position < 0;
  ELSE
    RAISE EXCEPTION 'Unknown list type: %', _list_type;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.normalize_level_ranks(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO service_role;