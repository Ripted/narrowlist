-- Level Jam: submissions, ratings and rating queue assignments.
-- Jam events are hardcoded in the frontend (src/config/events.ts), there is no
-- admin page. The submission/voting windows below must match that config.

CREATE TABLE public.jam_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jam_id text NOT NULL,
  user_id uuid NOT NULL,
  level_id text NOT NULL,
  level_name text NOT NULL,
  creator text,
  description text,
  video_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (jam_id, user_id)
);

CREATE INDEX idx_jam_submissions_jam ON public.jam_submissions(jam_id);

CREATE TABLE public.jam_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jam_id text NOT NULL,
  submission_id uuid NOT NULL REFERENCES public.jam_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enjoyment integer NOT NULL CHECK (enjoyment BETWEEN 1 AND 5),
  creativity integer NOT NULL CHECK (creativity BETWEEN 1 AND 5),
  design integer NOT NULL CHECK (design BETWEEN 1 AND 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

CREATE INDEX idx_jam_ratings_jam ON public.jam_ratings(jam_id);
CREATE INDEX idx_jam_ratings_submission ON public.jam_ratings(submission_id);

CREATE TABLE public.jam_rating_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jam_id text NOT NULL,
  submission_id uuid NOT NULL REFERENCES public.jam_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (submission_id, user_id)
);

CREATE INDEX idx_jam_rating_assignments_user ON public.jam_rating_assignments(jam_id, user_id);

ALTER TABLE public.jam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_rating_assignments ENABLE ROW LEVEL SECURITY;

-- Submission window per hardcoded jam (the 96h building phase).
CREATE OR REPLACE FUNCTION public.jam_submission_open(_jam_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE _jam_id
    WHEN 'level-jam-1' THEN
      now() >= timestamptz '2026-08-27 19:00:00+00'
      AND now() < timestamptz '2026-08-31 19:00:00+00'
    ELSE false
  END
$$;

-- Voting window per hardcoded jam (7 days after the jam ends).
CREATE OR REPLACE FUNCTION public.jam_voting_open(_jam_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE _jam_id
    WHEN 'level-jam-1' THEN
      now() >= timestamptz '2026-08-31 19:00:00+00'
      AND now() < timestamptz '2026-09-07 19:00:00+00'
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_jam_participant(_jam_id text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jam_submissions
    WHERE jam_id = _jam_id AND user_id = _user_id
  )
$$;

-- Participants may rate any level (except their own) while voting is open.
-- Everyone else must have received the level through the rating queue.
CREATE OR REPLACE FUNCTION public.can_rate_jam_submission(_submission_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub record;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  SELECT jam_id, user_id INTO _sub FROM public.jam_submissions WHERE id = _submission_id;
  IF _sub IS NULL THEN RETURN false; END IF;
  IF _sub.user_id = _user_id THEN RETURN false; END IF;
  IF NOT public.jam_voting_open(_sub.jam_id) THEN RETURN false; END IF;

  RETURN public.is_jam_participant(_sub.jam_id, _user_id)
    OR EXISTS (
      SELECT 1 FROM public.jam_rating_assignments
      WHERE submission_id = _submission_id AND user_id = _user_id
    );
END;
$$;

-- Queue assignments: allowed while voting is open, never for your own level
-- and never for a level you already rated.
CREATE OR REPLACE FUNCTION public.can_request_jam_assignment(_submission_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub record;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  SELECT jam_id, user_id INTO _sub FROM public.jam_submissions WHERE id = _submission_id;
  IF _sub IS NULL THEN RETURN false; END IF;
  IF _sub.user_id = _user_id THEN RETURN false; END IF;
  IF NOT public.jam_voting_open(_sub.jam_id) THEN RETURN false; END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.jam_ratings
    WHERE submission_id = _submission_id AND user_id = _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.jam_voting_open_for_submission(_submission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT public.jam_voting_open(jam_id) FROM public.jam_submissions WHERE id = _submission_id),
    false
  )
$$;

-- jam_submissions policies
CREATE POLICY "Jam submissions are viewable by everyone"
  ON public.jam_submissions FOR SELECT USING (true);

CREATE POLICY "Users can submit one level while the jam is running"
  ON public.jam_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.jam_submission_open(jam_id)
  );

CREATE POLICY "Users can edit own submission while the jam is running"
  ON public.jam_submissions FOR UPDATE
  USING (auth.uid() = user_id AND public.jam_submission_open(jam_id))
  WITH CHECK (auth.uid() = user_id AND public.jam_submission_open(jam_id));

CREATE POLICY "Users can delete own submission, admins can delete any"
  ON public.jam_submissions FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- jam_ratings policies
CREATE POLICY "Jam ratings are viewable by everyone"
  ON public.jam_ratings FOR SELECT USING (true);

CREATE POLICY "Eligible users can rate jam levels"
  ON public.jam_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_rate_jam_submission(submission_id, auth.uid())
  );

CREATE POLICY "Users can update own rating while voting is open"
  ON public.jam_ratings FOR UPDATE
  USING (auth.uid() = user_id AND public.jam_voting_open_for_submission(submission_id))
  WITH CHECK (auth.uid() = user_id AND public.jam_voting_open_for_submission(submission_id));

CREATE POLICY "Users can delete own rating, admins can delete any"
  ON public.jam_ratings FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- jam_rating_assignments policies
CREATE POLICY "Users can view own queue assignments, admins can view all"
  ON public.jam_rating_assignments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Logged-in users can request queue assignments"
  ON public.jam_rating_assignments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_request_jam_assignment(submission_id, auth.uid())
  );

CREATE POLICY "Users can remove own queue assignments, admins can remove any"
  ON public.jam_rating_assignments FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at triggers
CREATE TRIGGER update_jam_submissions_updated_at
  BEFORE UPDATE ON public.jam_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jam_ratings_updated_at
  BEFORE UPDATE ON public.jam_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
