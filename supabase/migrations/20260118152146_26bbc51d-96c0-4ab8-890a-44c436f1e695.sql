-- Create extra_completions table for tracking Extra List level completions
CREATE TABLE public.extra_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.extended_levels(id) ON DELETE CASCADE,
  run_id INTEGER,
  completion_time NUMERIC NOT NULL,
  arrow_name TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, level_id)
);

-- Enable RLS
ALTER TABLE public.extra_completions ENABLE ROW LEVEL SECURITY;

-- Create policies - anyone can read, only service role can write
CREATE POLICY "Anyone can view extra completions"
  ON public.extra_completions
  FOR SELECT
  USING (true);

-- Create function to recalculate player extra points
CREATE OR REPLACE FUNCTION public.recalculate_player_extra_points(player_profile_id UUID)
RETURNS void AS $$
DECLARE
  total_extra INTEGER := 0;
BEGIN
  -- Sum points from extra_completions
  SELECT COALESCE(SUM(el.points), 0) INTO total_extra
  FROM extra_completions ec
  JOIN extended_levels el ON ec.level_id = el.id
  WHERE ec.profile_id = player_profile_id;
  
  -- Update the profile
  UPDATE profiles SET extra_points = total_extra WHERE id = player_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update extra points when completions change
CREATE OR REPLACE FUNCTION public.update_extra_points_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_player_extra_points(NEW.profile_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_player_extra_points(OLD.profile_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_extra_points_on_extra_completion
  AFTER INSERT OR UPDATE OR DELETE ON public.extra_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_extra_points_on_completion();

-- Create index for performance
CREATE INDEX idx_extra_completions_profile ON public.extra_completions(profile_id);
CREATE INDEX idx_extra_completions_level ON public.extra_completions(level_id);