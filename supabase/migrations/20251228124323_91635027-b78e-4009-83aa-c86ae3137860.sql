-- Fix search_path for calculate_points_for_rank function
CREATE OR REPLACE FUNCTION public.calculate_points_for_rank(rank_position integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
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