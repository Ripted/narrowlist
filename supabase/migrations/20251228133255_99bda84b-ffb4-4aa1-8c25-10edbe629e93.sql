-- Add 'read' status option to run_submissions and level_submissions
-- This allows admins to mark submissions as read without approving/rejecting

-- No schema change needed - the status column is already TEXT type
-- We'll just use 'read' as another valid status value