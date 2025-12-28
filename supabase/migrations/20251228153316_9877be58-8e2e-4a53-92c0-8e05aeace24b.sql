-- Create user watchlist table for bookmarking levels
CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Enable RLS
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own watchlist" 
  ON public.user_watchlist FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist" 
  ON public.user_watchlist FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist" 
  ON public.user_watchlist FOR DELETE 
  USING (auth.uid() = user_id);

-- Create deleted levels archive for restore functionality
CREATE TABLE public.deleted_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  level_id TEXT NOT NULL,
  name TEXT,
  author TEXT,
  rank_position INTEGER NOT NULL,
  points INTEGER NOT NULL,
  thumbnail_url TEXT,
  alternative_ids TEXT[],
  verifier_profile_id UUID,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_by UUID NOT NULL,
  deleted_by_email TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.deleted_levels ENABLE ROW LEVEL SECURITY;

-- Only admins can manage deleted levels
CREATE POLICY "Admins can manage deleted levels" 
  ON public.deleted_levels FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to archive level before deletion
CREATE OR REPLACE FUNCTION public.archive_deleted_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.deleted_levels (
    original_id, level_id, name, author, rank_position, points, 
    thumbnail_url, alternative_ids, verifier_profile_id,
    deleted_by, deleted_by_email
  )
  VALUES (
    OLD.id, OLD.level_id, OLD.name, OLD.author, OLD.rank_position, OLD.points,
    OLD.thumbnail_url, OLD.alternative_ids, OLD.verifier_profile_id,
    auth.uid(), 
    COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'system')
  );
  RETURN OLD;
END;
$$;

-- Create trigger to archive before delete
CREATE TRIGGER archive_level_before_delete
  BEFORE DELETE ON public.levels
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_deleted_level();

-- Update cleanup function to delete changelog after 48 hours
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
  deleted_archives INTEGER;
BEGIN
  -- Delete admin_changelog entries older than 48 hours
  DELETE FROM admin_changelog
  WHERE created_at < NOW() - INTERVAL '48 hours';
  GET DIAGNOSTICS deleted_changelog = ROW_COUNT;

  -- Delete discord_notifications older than 30 days
  DELETE FROM discord_notifications
  WHERE notified_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;

  -- Delete archived/deleted levels older than 30 days (can't restore after 30 days)
  DELETE FROM deleted_levels
  WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_archives = ROW_COUNT;

  -- Remove redundant level_rank_history entries where rank didn't change
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
    'deleted_history_duplicates', deleted_history,
    'deleted_archives', deleted_archives
  );
END;
$$;