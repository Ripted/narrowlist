-- Fix search_path for the calculate_extra_level_points function
CREATE OR REPLACE FUNCTION public.calculate_extra_level_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Set points based on rank position using the calculate_extra_points_for_rank function
  NEW.points := public.calculate_extra_points_for_rank(NEW.rank_position);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;