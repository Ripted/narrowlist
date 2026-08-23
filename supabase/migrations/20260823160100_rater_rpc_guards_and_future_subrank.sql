-- 1. normalize_level_ranks: raters may normalize lists they manage.
--    For the future list, estimated ranks are freeform (duplicates allowed),
--    so only sub_rank is normalized within each rank group.
CREATE OR REPLACE FUNCTION public.normalize_level_ranks(_list_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.can_manage_list(auth.uid(), _list_type) THEN
    RAISE EXCEPTION 'Access required for list: %', _list_type;
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
    -- Estimated ranks are freeform; only resequence sub_rank within each rank group.
    WITH ordered AS (
      SELECT id,
             row_number() OVER (
               PARTITION BY rank_position
               ORDER BY sub_rank ASC, created_at ASC, id ASC
             )::int AS new_sub_rank
      FROM public.future_levels
    )
    UPDATE public.future_levels fl
    SET sub_rank = ordered.new_sub_rank
    FROM ordered
    WHERE fl.id = ordered.id
      AND fl.sub_rank IS DISTINCT FROM ordered.new_sub_rank;
  ELSE
    RAISE EXCEPTION 'Unknown list type: %', _list_type;
  END IF;
END;
$function$;

-- 2. admin_add_main_level: main raters allowed
CREATE OR REPLACE FUNCTION public.admin_add_main_level(
  _level_id text,
  _name text,
  _author text,
  _rank_position integer,
  _thumbnail_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_rank integer;
  _count integer;
  _new_id uuid;
BEGIN
  IF NOT public.can_manage_list(auth.uid(), 'main') THEN
    RAISE EXCEPTION 'Main list access required';
  END IF;

  PERFORM public.normalize_level_ranks('main');
  SELECT count(*) INTO _count FROM public.levels;
  _target_rank := LEAST(GREATEST(COALESCE(_rank_position, _count + 1), 1), _count + 1);

  UPDATE public.levels
  SET rank_position = rank_position + 1,
      points = public.calculate_points_for_rank(rank_position + 1)
  WHERE rank_position >= _target_rank;

  INSERT INTO public.levels (level_id, name, author, rank_position, points, thumbnail_url)
  VALUES (btrim(_level_id), _name, _author, _target_rank, public.calculate_points_for_rank(_target_rank), _thumbnail_url)
  RETURNING id INTO _new_id;

  PERFORM public.normalize_level_ranks('main');
  RETURN _new_id;
END;
$$;

-- 3. admin_add_extra_level: extra raters allowed
CREATE OR REPLACE FUNCTION public.admin_add_extra_level(
  _level_id text,
  _name text,
  _author text,
  _rank_position integer,
  _thumbnail_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_rank integer;
  _count integer;
  _new_id uuid;
BEGIN
  IF NOT public.can_manage_list(auth.uid(), 'extra') THEN
    RAISE EXCEPTION 'Extra list access required';
  END IF;

  PERFORM public.normalize_level_ranks('extra');
  SELECT count(*) INTO _count FROM public.extended_levels;
  _target_rank := LEAST(GREATEST(COALESCE(_rank_position, _count + 1), 1), _count + 1);

  UPDATE public.extended_levels
  SET rank_position = -(rank_position + 100000),
      points = public.calculate_extra_points_for_rank(rank_position + 1)
  WHERE rank_position >= _target_rank;

  UPDATE public.extended_levels
  SET rank_position = (-rank_position) - 99999,
      points = public.calculate_extra_points_for_rank(((-rank_position) - 99999))
  WHERE rank_position < -100000;

  INSERT INTO public.extended_levels (level_id, name, author, rank_position, points, thumbnail_url)
  VALUES (btrim(_level_id), _name, _author, _target_rank, public.calculate_extra_points_for_rank(_target_rank), _thumbnail_url)
  RETURNING id INTO _new_id;

  PERFORM public.normalize_level_ranks('extra');
  RETURN _new_id;
END;
$$;

-- 4. admin_add_future_level: future raters allowed; duplicate estimated ranks are
--    kept (no shifting) and the new level is appended to its rank group via sub_rank.
CREATE OR REPLACE FUNCTION public.admin_add_future_level(
  _level_id text,
  _name text,
  _author text,
  _rank_position integer,
  _thumbnail_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_rank integer;
  _sub_rank integer;
  _new_id uuid;
BEGIN
  IF NOT public.can_manage_list(auth.uid(), 'future') THEN
    RAISE EXCEPTION 'Future list access required';
  END IF;

  _target_rank := GREATEST(COALESCE(_rank_position, 1), 1);

  SELECT COALESCE(MAX(sub_rank), 0) + 1 INTO _sub_rank
  FROM public.future_levels
  WHERE rank_position = _target_rank;

  INSERT INTO public.future_levels (level_id, name, author, rank_position, sub_rank, points, thumbnail_url)
  VALUES (btrim(_level_id), _name, _author, _target_rank, _sub_rank, public.calculate_points_for_rank(_target_rank), _thumbnail_url)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) TO authenticated, service_role;
