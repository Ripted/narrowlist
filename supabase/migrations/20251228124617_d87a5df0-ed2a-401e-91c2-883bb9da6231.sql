
-- Function to recalculate a single player's total points
CREATE OR REPLACE FUNCTION public.recalculate_player_points(player_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(l.points), 0) INTO new_total
  FROM (
    SELECT DISTINCT level_id FROM (
      SELECT level_id FROM completions WHERE profile_id = player_profile_id
      UNION
      SELECT level_id FROM manual_runs WHERE profile_id = player_profile_id
    ) all_completions
  ) unique_levels
  JOIN levels l ON l.id = unique_levels.level_id;
  
  UPDATE profiles SET total_points = new_total WHERE id = player_profile_id;
END;
$$;

-- Trigger function for when completions are added/removed
CREATE OR REPLACE FUNCTION public.handle_completion_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_player_points(OLD.profile_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_player_points(NEW.profile_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for when manual_runs are added/removed
CREATE OR REPLACE FUNCTION public.handle_manual_run_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_player_points(OLD.profile_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_player_points(NEW.profile_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for when level points change
CREATE OR REPLACE FUNCTION public.handle_level_points_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate points for all players who completed this level
  UPDATE profiles p
  SET total_points = (
    SELECT COALESCE(SUM(l.points), 0)
    FROM (
      SELECT DISTINCT level_id FROM (
        SELECT level_id FROM completions WHERE profile_id = p.id
        UNION
        SELECT level_id FROM manual_runs WHERE profile_id = p.id
      ) all_completions
    ) unique_levels
    JOIN levels l ON l.id = unique_levels.level_id
  )
  WHERE p.id IN (
    SELECT DISTINCT profile_id FROM completions WHERE level_id = NEW.id
    UNION
    SELECT DISTINCT profile_id FROM manual_runs WHERE level_id = NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers for completions table
DROP TRIGGER IF EXISTS on_completion_change ON completions;
CREATE TRIGGER on_completion_change
  AFTER INSERT OR DELETE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_completion_change();

-- Create triggers for manual_runs table
DROP TRIGGER IF EXISTS on_manual_run_change ON manual_runs;
CREATE TRIGGER on_manual_run_change
  AFTER INSERT OR DELETE ON manual_runs
  FOR EACH ROW
  EXECUTE FUNCTION handle_manual_run_change();

-- Create trigger for level points changes
DROP TRIGGER IF EXISTS on_level_points_change ON levels;
CREATE TRIGGER on_level_points_change
  AFTER UPDATE OF points ON levels
  FOR EACH ROW
  WHEN (OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION handle_level_points_change();
