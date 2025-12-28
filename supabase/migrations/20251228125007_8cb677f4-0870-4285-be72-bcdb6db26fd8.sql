
-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to clean up old/redundant data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_changelog INTEGER;
  deleted_notifications INTEGER;
  deleted_history INTEGER;
BEGIN
  -- Delete admin_changelog entries older than 90 days
  DELETE FROM admin_changelog
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_changelog = ROW_COUNT;

  -- Delete discord_notifications older than 30 days
  DELETE FROM discord_notifications
  WHERE notified_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;

  -- Remove redundant level_rank_history entries where rank didn't change
  -- Keep first and last entry of each unchanged period
  WITH ranked_history AS (
    SELECT 
      id,
      level_id,
      rank_position,
      recorded_at,
      LAG(rank_position) OVER (PARTITION BY level_id ORDER BY recorded_at) as prev_rank,
      LEAD(rank_position) OVER (PARTITION BY level_id ORDER BY recorded_at) as next_rank
    FROM level_rank_history
    WHERE recorded_at < NOW() - INTERVAL '7 days'
  ),
  deletable AS (
    SELECT id 
    FROM ranked_history
    WHERE rank_position = prev_rank 
      AND rank_position = next_rank
  )
  DELETE FROM level_rank_history
  WHERE id IN (SELECT id FROM deletable);
  GET DIAGNOSTICS deleted_history = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_changelog', deleted_changelog,
    'deleted_notifications', deleted_notifications,
    'deleted_history_duplicates', deleted_history
  );
END;
$$;
