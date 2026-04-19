-- Stage 1: Descriptions + Rating system

-- 1. Add description column to all 3 level tables
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.extended_levels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.future_levels ADD COLUMN IF NOT EXISTS description text;

-- 2. Create level_ratings table
CREATE TABLE public.level_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL,
  level_type text NOT NULL CHECK (level_type IN ('main', 'extra')),
  user_id uuid NOT NULL,
  enjoyment integer NOT NULL CHECK (enjoyment BETWEEN 1 AND 10),
  design integer NOT NULL CHECK (design BETWEEN 1 AND 10),
  decoration integer NOT NULL CHECK (decoration BETWEEN 1 AND 10),
  gameplay integer NOT NULL CHECK (gameplay BETWEEN 1 AND 10),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (level_id, user_id)
);

CREATE INDEX idx_level_ratings_level ON public.level_ratings(level_id, level_type);
CREATE INDEX idx_level_ratings_user ON public.level_ratings(user_id);

ALTER TABLE public.level_ratings ENABLE ROW LEVEL SECURITY;

-- 3. Helper: check if a user has completed a given level
CREATE OR REPLACE FUNCTION public.user_has_completed_level(
  _user_id uuid,
  _level_id uuid,
  _level_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  IF _profile_id IS NULL THEN RETURN false; END IF;

  IF _level_type = 'main' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.completions
      WHERE profile_id = _profile_id AND level_id = _level_id
      UNION ALL
      SELECT 1 FROM public.manual_runs
      WHERE profile_id = _profile_id AND level_id = _level_id AND list_type = 'main'
    );
  ELSIF _level_type = 'extra' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.extra_completions
      WHERE profile_id = _profile_id AND level_id = _level_id
      UNION ALL
      SELECT 1 FROM public.manual_runs
      WHERE profile_id = _profile_id AND level_id = _level_id AND list_type = 'extra'
    );
  END IF;

  RETURN false;
END;
$$;

-- 4. RLS policies for level_ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON public.level_ratings FOR SELECT USING (true);

CREATE POLICY "Users can insert if completed or admin"
  ON public.level_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.user_has_completed_level(auth.uid(), level_id, level_type)
    )
  );

CREATE POLICY "Users can update own rating if still eligible or admin"
  ON public.level_ratings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete own rating, admins can delete any"
  ON public.level_ratings FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. updated_at trigger
CREATE TRIGGER update_level_ratings_updated_at
  BEFORE UPDATE ON public.level_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();