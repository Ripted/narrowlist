-- Create trigger function to calculate extra points based on rank
CREATE OR REPLACE FUNCTION public.calculate_extra_level_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Set points based on rank position using the calculate_extra_points_for_rank function
  NEW.points := calculate_extra_points_for_rank(NEW.rank_position);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE on extended_levels
DROP TRIGGER IF EXISTS set_extended_level_points ON public.extended_levels;
CREATE TRIGGER set_extended_level_points
BEFORE INSERT OR UPDATE ON public.extended_levels
FOR EACH ROW
EXECUTE FUNCTION public.calculate_extra_level_points();

-- Update existing extended_levels to have correct points
UPDATE public.extended_levels SET points = calculate_extra_points_for_rank(rank_position);