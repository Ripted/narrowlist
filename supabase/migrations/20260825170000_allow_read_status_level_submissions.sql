-- Allow 'read' status on level_submissions.
-- The 20251228 migration intended to add 'read' as a valid status, but the
-- CHECK constraint from table creation still rejected it. Marking a level
-- submission as read therefore failed silently and the pending badge in the
-- admin panel never cleared. run_submissions never had this constraint.

ALTER TABLE public.level_submissions
  DROP CONSTRAINT IF EXISTS level_submissions_status_check;

ALTER TABLE public.level_submissions
  ADD CONSTRAINT level_submissions_status_check
  CHECK (status IN ('pending', 'read', 'approved', 'rejected'));
