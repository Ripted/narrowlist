-- Level Jam follow-up: multiple submissions per user, collaborators,
-- per-entry pages, and the queue unlock rule.
-- Apply AFTER 20260825140000_level_jam.sql and 20260825153000_jam_fixes.sql.

-- ============================================================
-- jam_submissions: multi-entry support
-- ============================================================

-- One user may now create up to 5 entries per jam.
ALTER TABLE public.jam_submissions DROP CONSTRAINT jam_submissions_jam_id_user_id_key;

-- Videos are not part of jam entries.
ALTER TABLE public.jam_submissions DROP COLUMN video_url;

-- URL slug for the public entry page (/events/:jam/level/:slug).
ALTER TABLE public.jam_submissions ADD COLUMN slug text;
UPDATE public.jam_submissions
  SET slug = lower(regexp_replace(level_name, '[^a-zA-Z0-9]+', '-', 'g'));
ALTER TABLE public.jam_submissions ALTER COLUMN slug SET NOT NULL;

-- Slugs and level names are unique per jam.
CREATE UNIQUE INDEX jam_submissions_jam_slug_key ON public.jam_submissions (jam_id, slug);
CREATE UNIQUE INDEX jam_submissions_jam_level_name_key ON public.jam_submissions (jam_id, lower(level_name));

-- Max 5 entries per creator per jam.
CREATE OR REPLACE FUNCTION public.jam_entry_count(_jam_id text, _user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.jam_submissions
  WHERE jam_id = _jam_id AND user_id = _user_id
$$;

-- After the jam ends only the description may change; identity fields are locked.
CREATE OR REPLACE FUNCTION public.jam_submission_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.jam_submission_open(OLD.jam_id) THEN
    IF NEW.jam_id IS DISTINCT FROM OLD.jam_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.level_id IS DISTINCT FROM OLD.level_id
       OR NEW.level_name IS DISTINCT FROM OLD.level_name
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR NEW.creator IS DISTINCT FROM OLD.creator THEN
      RAISE EXCEPTION 'Only the description can be changed after the jam ends';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_submission_guard_trigger
  BEFORE UPDATE ON public.jam_submissions
  FOR EACH ROW EXECUTE FUNCTION public.jam_submission_guard();

-- ============================================================
-- jam_collaborators
-- ============================================================

CREATE TABLE public.jam_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.jam_submissions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (submission_id, profile_id)
);

CREATE INDEX idx_jam_collaborators_submission ON public.jam_collaborators(submission_id);
CREATE INDEX idx_jam_collaborators_profile ON public.jam_collaborators(profile_id);

ALTER TABLE public.jam_collaborators ENABLE ROW LEVEL SECURITY;

-- Is this profile a collaborator on the given submission?
CREATE OR REPLACE FUNCTION public.is_jam_collaborator(_submission_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jam_collaborators
    WHERE submission_id = _submission_id AND profile_id = _profile_id
  )
$$;

-- Can this user manage collaborators of the submission? Only the creator,
-- and only while the jam is running.
CREATE OR REPLACE FUNCTION public.can_manage_jam_collaborators(_submission_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jam_submissions s
    WHERE s.id = _submission_id
      AND s.user_id = _user_id
      AND public.jam_submission_open(s.jam_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.jam_collaborator_count(_submission_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.jam_collaborators WHERE submission_id = _submission_id
$$;

CREATE POLICY "Jam collaborators are viewable by everyone"
  ON public.jam_collaborators FOR SELECT USING (true);

CREATE POLICY "Creators manage collaborators while the jam is running"
  ON public.jam_collaborators FOR INSERT
  WITH CHECK (
    public.can_manage_jam_collaborators(submission_id, auth.uid())
    AND public.jam_collaborator_count(submission_id) < 15
    AND NOT EXISTS (
      -- the creator cannot add themselves
      SELECT 1 FROM public.jam_submissions s
      JOIN public.profiles p ON p.user_id = s.user_id
      WHERE s.id = submission_id AND p.id = profile_id
    )
  );

CREATE POLICY "Creators remove collaborators while the jam is running"
  ON public.jam_collaborators FOR DELETE
  USING (public.can_manage_jam_collaborators(submission_id, auth.uid()));

-- ============================================================
-- Participant + rating rules now include collaborators
-- and the "5 queue ratings unlock free voting" rule.
-- ============================================================

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
  OR EXISTS (
    SELECT 1 FROM public.jam_collaborators c
    JOIN public.jam_submissions s ON s.id = c.submission_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE s.jam_id = _jam_id AND p.user_id = _user_id
  )
$$;

-- A non-participant who rated at least 5 levels through the queue may
-- rate any level directly, just like participants.
CREATE OR REPLACE FUNCTION public.jam_unlocked_free_voting(_jam_id text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.jam_ratings
    WHERE jam_id = _jam_id AND user_id = _user_id
  ) >= 5
$$;

-- Users involved in a submission (creator or collaborator) may never rate it.
CREATE OR REPLACE FUNCTION public.is_jam_entry_member(_submission_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jam_submissions s
    WHERE s.id = _submission_id AND s.user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.jam_collaborators c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE c.submission_id = _submission_id AND p.user_id = _user_id
  )
$$;

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
  IF public.is_jam_entry_member(_submission_id, _user_id) THEN RETURN false; END IF;
  IF NOT public.jam_voting_open(_sub.jam_id) THEN RETURN false; END IF;

  RETURN public.is_jam_participant(_sub.jam_id, _user_id)
    OR public.jam_unlocked_free_voting(_sub.jam_id, _user_id)
    OR EXISTS (
      SELECT 1 FROM public.jam_rating_assignments
      WHERE submission_id = _submission_id AND user_id = _user_id
    );
END;
$$;

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
  IF public.is_jam_entry_member(_submission_id, _user_id) THEN RETURN false; END IF;
  IF NOT public.jam_voting_open(_sub.jam_id) THEN RETURN false; END IF;

  -- Max 5 outstanding queue assignments per user and jam.
  IF (
    SELECT COUNT(*) FROM public.jam_rating_assignments
    WHERE jam_id = _sub.jam_id AND user_id = _user_id
  ) >= 5 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.jam_ratings
    WHERE submission_id = _submission_id AND user_id = _user_id
  );
END;
$$;

-- ============================================================
-- jam_submissions policy updates
-- ============================================================

DROP POLICY "Users can submit one level while the jam is running" ON public.jam_submissions;

CREATE POLICY "Users can submit up to 5 levels while the jam is running"
  ON public.jam_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.jam_submission_open(jam_id)
    AND public.jam_entry_count(jam_id, auth.uid()) < 5
  );

DROP POLICY "Users can edit own submission while the jam is running" ON public.jam_submissions;

-- Creators can edit their entry at any time; the jam_submission_guard trigger
-- restricts edits after the jam ends to the description only.
CREATE POLICY "Creators can edit own submissions"
  ON public.jam_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
