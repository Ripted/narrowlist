ALTER TABLE public.level_rank_history ADD COLUMN IF NOT EXISTS previous_rank integer;

-- Backfill previous_rank from the preceding history entry for each level
WITH ordered AS (
  SELECT id, LAG(rank_position) OVER (PARTITION BY level_id ORDER BY recorded_at, id) AS prev
  FROM public.level_rank_history
)
UPDATE public.level_rank_history h
SET previous_rank = o.prev
FROM ordered o
WHERE h.id = o.id AND h.previous_rank IS NULL AND o.prev IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_level_rank_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.rank_position < 0 OR OLD.rank_position < 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.rank_position <> OLD.rank_position THEN
    INSERT INTO public.level_rank_history (level_id, rank_position, points, previous_rank)
    VALUES (NEW.id, NEW.rank_position, NEW.points, OLD.rank_position);
  END IF;

  RETURN NEW;
END;
$function$;