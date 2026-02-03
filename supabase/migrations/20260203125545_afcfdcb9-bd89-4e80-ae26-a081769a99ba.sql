-- Add trigger to auto-recalculate extra_points after extra_completions changes

CREATE OR REPLACE FUNCTION public.update_extra_points_on_completion_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_player_extra_points(OLD.profile_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_player_extra_points(NEW.profile_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_extra_completion_change ON public.extra_completions;
CREATE TRIGGER on_extra_completion_change
AFTER INSERT OR UPDATE OR DELETE ON public.extra_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_extra_points_on_completion_change();