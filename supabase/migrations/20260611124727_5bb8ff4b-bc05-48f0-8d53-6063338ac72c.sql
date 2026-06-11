
CREATE OR REPLACE FUNCTION public.handle_level_rank_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rank_diff INTEGER;
BEGIN
  -- Skip temporary negative ranks used during normalization/reordering
  IF NEW.rank_position < 0 OR OLD.rank_position < 0 THEN
    RETURN NEW;
  END IF;

  rank_diff := ABS(NEW.rank_position - OLD.rank_position);

  IF rank_diff >= 5 THEN
    DELETE FROM public.level_feedback WHERE level_id = NEW.id;
  END IF;

  IF NEW.rank_position <> OLD.rank_position THEN
    INSERT INTO public.level_rank_history (level_id, rank_position, points)
    VALUES (NEW.id, NEW.rank_position, NEW.points);
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_level_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.rank_position < 0 THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.level_rank_history (level_id, rank_position, points)
  VALUES (NEW.id, NEW.rank_position, NEW.points);
  RETURN NEW;
END;
$function$;

-- Clean up bad historical entries with negative ranks
DELETE FROM public.level_rank_history WHERE rank_position < 0;
