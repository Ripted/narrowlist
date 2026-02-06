-- Add list_type column to manual_runs to support Extra List manual runs
-- Values: 'main' (default) or 'extra'
ALTER TABLE public.manual_runs ADD COLUMN list_type text NOT NULL DEFAULT 'main';

-- Add index for faster filtering by list type
CREATE INDEX idx_manual_runs_list_type ON public.manual_runs(list_type);

-- Add a foreign key constraint for extra manual runs to reference extended_levels
-- We can't add a direct FK because level_id can point to either levels or extended_levels
-- Instead, we'll validate this at the application level

-- Create a trigger function to handle extra manual run completions
CREATE OR REPLACE FUNCTION public.handle_extra_manual_run_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only handle extra list manual runs
  IF (TG_OP = 'DELETE' AND OLD.list_type = 'extra') THEN
    PERFORM recalculate_player_extra_points(OLD.profile_id);
    RETURN OLD;
  ELSIF (NEW.list_type = 'extra') THEN
    PERFORM recalculate_player_extra_points(NEW.profile_id);
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_extra_manual_run_change ON public.manual_runs;
CREATE TRIGGER handle_extra_manual_run_change
AFTER INSERT OR UPDATE OR DELETE ON public.manual_runs
FOR EACH ROW
EXECUTE FUNCTION public.handle_extra_manual_run_change();

-- Update recalculate_player_extra_points to include extra manual runs
CREATE OR REPLACE FUNCTION public.recalculate_player_extra_points(player_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_extra INTEGER := 0;
BEGIN
  -- Sum points from extra_completions
  SELECT COALESCE(SUM(el.points), 0) INTO total_extra
  FROM extra_completions ec
  JOIN extended_levels el ON ec.level_id = el.id
  WHERE ec.profile_id = player_profile_id;
  
  -- Also add points from extra manual runs (avoiding duplicates)
  total_extra := total_extra + COALESCE((
    SELECT SUM(el.points)
    FROM manual_runs mr
    JOIN extended_levels el ON mr.level_id = el.id
    WHERE mr.profile_id = player_profile_id
      AND mr.list_type = 'extra'
      AND NOT EXISTS (
        SELECT 1 FROM extra_completions ec 
        WHERE ec.profile_id = mr.profile_id 
        AND ec.level_id = mr.level_id
      )
  ), 0);
  
  -- Update the profile
  UPDATE profiles SET extra_points = total_extra WHERE id = player_profile_id;
END;
$function$;

-- Update recalculate_all_extra_points to include extra manual runs
CREATE OR REPLACE FUNCTION public.recalculate_all_extra_points()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.profiles p
  SET extra_points = COALESCE((
    -- Sum from extra_completions
    SELECT SUM(el.points)
    FROM public.extra_completions ec
    JOIN public.extended_levels el ON el.id = ec.level_id
    WHERE ec.profile_id = p.id
  ), 0) + COALESCE((
    -- Add extra manual runs (avoiding duplicates)
    SELECT SUM(el.points)
    FROM public.manual_runs mr
    JOIN public.extended_levels el ON el.id = mr.level_id
    WHERE mr.profile_id = p.id
      AND mr.list_type = 'extra'
      AND NOT EXISTS (
        SELECT 1 FROM public.extra_completions ec 
        WHERE ec.profile_id = mr.profile_id 
        AND ec.level_id = mr.level_id
      )
  ), 0);
$function$;