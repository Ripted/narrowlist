CREATE OR REPLACE FUNCTION public.normalize_level_ranks(_list_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
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
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
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
  _count integer;
  _new_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  PERFORM public.normalize_level_ranks('future');
  SELECT count(*) INTO _count FROM public.future_levels;
  _target_rank := LEAST(GREATEST(COALESCE(_rank_position, _count + 1), 1), _count + 1);

  UPDATE public.future_levels
  SET rank_position = rank_position + 1,
      points = public.calculate_points_for_rank(rank_position + 1)
  WHERE rank_position >= _target_rank;

  INSERT INTO public.future_levels (level_id, name, author, rank_position, points, thumbnail_url)
  VALUES (btrim(_level_id), _name, _author, _target_rank, public.calculate_points_for_rank(_target_rank), _thumbnail_url)
  RETURNING id INTO _new_id;

  PERFORM public.normalize_level_ranks('future');
  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) TO authenticated, service_role;

SELECT public.normalize_level_ranks('main');
SELECT public.normalize_level_ranks('extra');
SELECT public.normalize_level_ranks('future');