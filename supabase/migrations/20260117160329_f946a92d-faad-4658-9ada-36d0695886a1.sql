-- Add target_list column to level_submissions for submitting to different lists
ALTER TABLE public.level_submissions 
ADD COLUMN IF NOT EXISTS target_list TEXT NOT NULL DEFAULT 'main' 
CHECK (target_list IN ('main', 'extra', 'future'));

-- Add approved_list column for when admin approves to a different list
ALTER TABLE public.level_submissions 
ADD COLUMN IF NOT EXISTS approved_list TEXT CHECK (approved_list IN ('main', 'extra', 'future'));

-- Add extra_points column to profiles for Extra Points system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS extra_points INTEGER NOT NULL DEFAULT 0;

-- Create function to calculate extra points for extended list based on rank
CREATE OR REPLACE FUNCTION public.calculate_extra_points_for_rank(rank_position INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Extra points are about 1/3 of main points
  CASE
    WHEN rank_position = 1 THEN RETURN 10;
    WHEN rank_position = 2 THEN RETURN 8;
    WHEN rank_position = 3 THEN RETURN 7;
    WHEN rank_position = 4 THEN RETURN 6;
    WHEN rank_position = 5 THEN RETURN 5;
    WHEN rank_position <= 10 THEN RETURN 3;
    WHEN rank_position <= 25 THEN RETURN 2;
    ELSE RETURN 1;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Update extended_levels to use calculated extra points
UPDATE public.extended_levels 
SET points = public.calculate_extra_points_for_rank(rank_position);

-- Add trigger for extended_levels to auto-calculate points
CREATE OR REPLACE FUNCTION public.update_extended_level_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.points := public.calculate_extra_points_for_rank(NEW.rank_position);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS extended_levels_update_points ON public.extended_levels;
CREATE TRIGGER extended_levels_update_points
  BEFORE INSERT OR UPDATE OF rank_position ON public.extended_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_extended_level_points();

-- Create function to recalculate extra points for a player
CREATE OR REPLACE FUNCTION public.recalculate_player_extra_points(player_profile_id UUID)
RETURNS VOID AS $$
DECLARE
  total_extra INTEGER := 0;
  extended_completion RECORD;
BEGIN
  -- Sum extra points from extended level completions
  -- Completions reference levels table (main list), we need to check extended_levels
  -- Manual runs can reference extended levels too
  
  -- For now, we'll track extra points separately when runs are added to extended levels
  -- Get completions on extended levels via level_id matching
  FOR extended_completion IN 
    SELECT DISTINCT el.points
    FROM public.extended_levels el
    INNER JOIN public.manual_runs mr ON mr.level_id = el.id
    WHERE mr.profile_id = player_profile_id
  LOOP
    total_extra := total_extra + extended_completion.points;
  END LOOP;
  
  -- Update the profile
  UPDATE public.profiles 
  SET extra_points = total_extra 
  WHERE id = player_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;