-- Create table to track level rank history
CREATE TABLE public.level_rank_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  points INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.level_rank_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view history
CREATE POLICY "Level rank history is viewable by everyone"
ON public.level_rank_history
FOR SELECT
USING (true);

-- Only admins can manage history
CREATE POLICY "Admins can manage level rank history"
ON public.level_rank_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_level_rank_history_recorded_at ON public.level_rank_history(recorded_at);
CREATE INDEX idx_level_rank_history_level_id ON public.level_rank_history(level_id);

-- Function to clear feedback when level moves 5+ spots
CREATE OR REPLACE FUNCTION public.handle_level_rank_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rank_diff INTEGER;
BEGIN
  -- Calculate rank difference
  rank_diff := ABS(NEW.rank_position - OLD.rank_position);
  
  -- If level moved 5 or more spots, clear feedback
  IF rank_diff >= 5 THEN
    DELETE FROM public.level_feedback WHERE level_id = NEW.id;
  END IF;
  
  -- Log the rank change to history (only if rank actually changed)
  IF NEW.rank_position <> OLD.rank_position THEN
    INSERT INTO public.level_rank_history (level_id, rank_position, points)
    VALUES (NEW.id, NEW.rank_position, NEW.points);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for rank changes
CREATE TRIGGER on_level_rank_change
  AFTER UPDATE OF rank_position ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_level_rank_change();

-- Function to record initial rank when level is created
CREATE OR REPLACE FUNCTION public.handle_level_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.level_rank_history (level_id, rank_position, points)
  VALUES (NEW.id, NEW.rank_position, NEW.points);
  RETURN NEW;
END;
$$;

-- Trigger for new levels
CREATE TRIGGER on_level_created
  AFTER INSERT ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_level_created();

-- Record current state of all levels as initial snapshot
INSERT INTO public.level_rank_history (level_id, rank_position, points, recorded_at)
SELECT id, rank_position, points, now()
FROM public.levels;