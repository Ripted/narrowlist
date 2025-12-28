-- Function to calculate points based on rank position
CREATE OR REPLACE FUNCTION public.calculate_points_for_rank(rank_position integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF rank_position = 1 THEN RETURN 30;
  ELSIF rank_position = 2 THEN RETURN 24;
  ELSIF rank_position = 3 THEN RETURN 20;
  ELSIF rank_position = 4 THEN RETURN 16;
  ELSIF rank_position = 5 THEN RETURN 13;
  ELSIF rank_position >= 6 AND rank_position <= 10 THEN RETURN 9;
  ELSIF rank_position >= 11 AND rank_position <= 25 THEN RETURN 6;
  ELSIF rank_position >= 26 AND rank_position <= 50 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- Trigger function to auto-set points based on rank
CREATE OR REPLACE FUNCTION public.auto_set_level_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Automatically calculate points based on rank_position
  NEW.points := calculate_points_for_rank(NEW.rank_position);
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER set_level_points_on_insert
BEFORE INSERT ON public.levels
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_level_points();

-- Create trigger for UPDATE (when rank_position changes)
CREATE TRIGGER set_level_points_on_update
BEFORE UPDATE OF rank_position ON public.levels
FOR EACH ROW
WHEN (OLD.rank_position IS DISTINCT FROM NEW.rank_position)
EXECUTE FUNCTION public.auto_set_level_points();

-- Update all existing levels to have correct points based on their rank
UPDATE public.levels
SET points = calculate_points_for_rank(rank_position);

-- Also update future_levels table
UPDATE public.future_levels
SET points = (
  CASE
    WHEN rank_position = 1 THEN 30
    WHEN rank_position = 2 THEN 24
    WHEN rank_position = 3 THEN 20
    WHEN rank_position = 4 THEN 16
    WHEN rank_position = 5 THEN 13
    WHEN rank_position >= 6 AND rank_position <= 10 THEN 9
    WHEN rank_position >= 11 AND rank_position <= 25 THEN 6
    WHEN rank_position >= 26 AND rank_position <= 50 THEN 2
    ELSE 1
  END
);