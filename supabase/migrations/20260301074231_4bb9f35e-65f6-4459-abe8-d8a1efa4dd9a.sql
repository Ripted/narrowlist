
-- 1. Fix calculate_points_for_rank() to use correct new tiers
CREATE OR REPLACE FUNCTION public.calculate_points_for_rank(rank_position integer)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF rank_position = 1 THEN RETURN 28;
  ELSIF rank_position = 2 THEN RETURN 24;
  ELSIF rank_position = 3 THEN RETURN 21;
  ELSIF rank_position = 4 THEN RETURN 18;
  ELSIF rank_position = 5 THEN RETURN 16;
  ELSIF rank_position >= 6 AND rank_position <= 10 THEN RETURN 13;
  ELSIF rank_position >= 11 AND rank_position <= 20 THEN RETURN 10;
  ELSIF rank_position >= 21 AND rank_position <= 30 THEN RETURN 7;
  ELSIF rank_position >= 31 AND rank_position <= 50 THEN RETURN 4;
  ELSIF rank_position >= 51 AND rank_position <= 70 THEN RETURN 2;
  ELSIF rank_position >= 71 AND rank_position <= 100 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$function$;

-- 2. Recalculate all level points using the corrected function
UPDATE levels SET points = calculate_points_for_rank(rank_position);

-- 3. Re-rank extended_levels sequentially to fix duplicate ranks
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY rank_position, created_at) as new_rank
  FROM extended_levels
)
UPDATE extended_levels el
SET rank_position = r.new_rank
FROM ranked r
WHERE el.id = r.id;

-- 4. Recalculate all player total_points
UPDATE profiles p
SET total_points = COALESCE((
  SELECT SUM(l.points)
  FROM (
    SELECT DISTINCT level_id FROM (
      SELECT level_id FROM completions WHERE profile_id = p.id
      UNION
      SELECT level_id FROM manual_runs WHERE profile_id = p.id
    ) all_completions
  ) unique_levels
  JOIN levels l ON l.id = unique_levels.level_id
), 0);

-- 5. Recalculate all extra points
SELECT recalculate_all_extra_points();

-- 6. Re-create triggers for levels table to use updated function
DROP TRIGGER IF EXISTS auto_set_level_points_trigger ON levels;
CREATE TRIGGER auto_set_level_points_trigger
  BEFORE INSERT OR UPDATE OF rank_position ON levels
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_level_points();

DROP TRIGGER IF EXISTS handle_level_rank_change_trigger ON levels;
CREATE TRIGGER handle_level_rank_change_trigger
  AFTER UPDATE OF rank_position ON levels
  FOR EACH ROW
  EXECUTE FUNCTION handle_level_rank_change();

DROP TRIGGER IF EXISTS handle_level_created_trigger ON levels;
CREATE TRIGGER handle_level_created_trigger
  AFTER INSERT ON levels
  FOR EACH ROW
  EXECUTE FUNCTION handle_level_created();
