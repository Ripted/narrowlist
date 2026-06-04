
-- 1. Add added_at column to track when levels were added
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS added_at timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE public.extended_levels ADD COLUMN IF NOT EXISTS added_at timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE public.future_levels ADD COLUMN IF NOT EXISTS added_at timestamp with time zone NOT NULL DEFAULT now();

-- Backfill old levels from created_at (acts as best-effort "verification date" proxy)
UPDATE public.levels SET added_at = created_at WHERE added_at IS NULL OR added_at > created_at;
UPDATE public.extended_levels SET added_at = created_at WHERE added_at IS NULL OR added_at > created_at;
UPDATE public.future_levels SET added_at = created_at WHERE added_at IS NULL OR added_at > created_at;

-- 2. Security: lock down admin RPCs so anonymous / non-admin users cannot call them via PostgREST
REVOKE ALL ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_level_ranks(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO authenticated;

-- 3. Harden normalize_level_ranks: remove the `auth.uid() IS NULL` bypass that let anon callers through
CREATE OR REPLACE FUNCTION public.normalize_level_ranks(_list_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid())) THEN
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
$function$;
