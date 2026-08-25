-- Level Jam follow-up fixes (apply after 20260825140000_level_jam.sql)

-- 1. Cap the rating queue server-side. Previously the 5-assignment limit was
-- only enforced in the UI, so anyone hitting the API directly could assign
-- themselves every level and bypass the queue.
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

-- 2. Gate deleting your own submission to the 96h submission window. Deleting
-- later would cascade and wipe every rating the level received during voting.
-- Admins can still delete at any time.
DROP POLICY "Users can delete own submission, admins can delete any" ON public.jam_submissions;

CREATE POLICY "Users can delete own submission while jam is running, admins any"
  ON public.jam_submissions FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() = user_id AND public.jam_submission_open(jam_id))
  );
