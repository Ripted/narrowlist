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

  SELECT count(*) INTO _count FROM public.future_levels;
  _target_rank := GREATEST(COALESCE(_rank_position, _count + 1), 1);

  INSERT INTO public.future_levels (level_id, name, author, rank_position, points, thumbnail_url)
  VALUES (btrim(_level_id), _name, _author, _target_rank, public.calculate_points_for_rank(_target_rank), _thumbnail_url)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;