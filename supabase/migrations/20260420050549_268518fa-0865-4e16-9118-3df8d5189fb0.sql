-- Allow 0.5 decimals for ratings
ALTER TABLE public.level_ratings
  ALTER COLUMN enjoyment TYPE numeric(3,1),
  ALTER COLUMN design TYPE numeric(3,1),
  ALTER COLUMN decoration TYPE numeric(3,1),
  ALTER COLUMN gameplay TYPE numeric(3,1);

-- Add validation: 1-10 in 0.5 steps
CREATE OR REPLACE FUNCTION public.validate_level_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.enjoyment < 1 OR NEW.enjoyment > 10 OR (NEW.enjoyment * 2) <> FLOOR(NEW.enjoyment * 2) THEN
    RAISE EXCEPTION 'enjoyment must be 1-10 in 0.5 increments';
  END IF;
  IF NEW.design < 1 OR NEW.design > 10 OR (NEW.design * 2) <> FLOOR(NEW.design * 2) THEN
    RAISE EXCEPTION 'design must be 1-10 in 0.5 increments';
  END IF;
  IF NEW.decoration < 1 OR NEW.decoration > 10 OR (NEW.decoration * 2) <> FLOOR(NEW.decoration * 2) THEN
    RAISE EXCEPTION 'decoration must be 1-10 in 0.5 increments';
  END IF;
  IF NEW.gameplay < 1 OR NEW.gameplay > 10 OR (NEW.gameplay * 2) <> FLOOR(NEW.gameplay * 2) THEN
    RAISE EXCEPTION 'gameplay must be 1-10 in 0.5 increments';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_level_rating_trigger ON public.level_ratings;
CREATE TRIGGER validate_level_rating_trigger
  BEFORE INSERT OR UPDATE ON public.level_ratings
  FOR EACH ROW EXECUTE FUNCTION public.validate_level_rating();

-- Community tag votes (links to admin tag_presets only)
CREATE TABLE public.level_tag_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL,
  level_type text NOT NULL CHECK (level_type IN ('main','extra')),
  preset_id uuid NOT NULL REFERENCES public.tag_presets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(level_id, level_type, preset_id, user_id)
);

CREATE INDEX idx_level_tag_votes_level ON public.level_tag_votes(level_id, level_type);
CREATE INDEX idx_level_tag_votes_user ON public.level_tag_votes(user_id);

ALTER TABLE public.level_tag_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tag votes viewable by everyone"
  ON public.level_tag_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote tags if completed or admin"
  ON public.level_tag_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (has_role(auth.uid(), 'admin'::app_role)
         OR user_has_completed_level(auth.uid(), level_id, level_type))
  );

CREATE POLICY "Users can remove own tag vote, admins any"
  ON public.level_tag_votes FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Difficulty tier votes (D0..D8 in 0.1 steps -> stored as numeric)
CREATE TABLE public.level_difficulty_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL,
  level_type text NOT NULL CHECK (level_type IN ('main','extra')),
  user_id uuid NOT NULL,
  difficulty numeric(3,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(level_id, level_type, user_id)
);

CREATE INDEX idx_level_difficulty_votes_level ON public.level_difficulty_votes(level_id, level_type);

ALTER TABLE public.level_difficulty_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Difficulty votes viewable by everyone"
  ON public.level_difficulty_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote difficulty if completed or admin"
  ON public.level_difficulty_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (has_role(auth.uid(), 'admin'::app_role)
         OR user_has_completed_level(auth.uid(), level_id, level_type))
  );

CREATE POLICY "Users can update own difficulty or admin"
  ON public.level_difficulty_votes FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own difficulty, admins any"
  ON public.level_difficulty_votes FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.validate_difficulty_vote()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.difficulty < 0 OR NEW.difficulty > 8 OR (NEW.difficulty * 10) <> FLOOR(NEW.difficulty * 10) THEN
    RAISE EXCEPTION 'difficulty must be 0-8 in 0.1 increments';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_difficulty_vote_trigger
  BEFORE INSERT OR UPDATE ON public.level_difficulty_votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_difficulty_vote();

CREATE TRIGGER update_level_difficulty_votes_updated_at
  BEFORE UPDATE ON public.level_difficulty_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();