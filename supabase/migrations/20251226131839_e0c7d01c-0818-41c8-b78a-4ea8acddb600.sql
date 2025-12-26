-- Add proof_url column to manual_runs table
ALTER TABLE public.manual_runs ADD COLUMN IF NOT EXISTS proof_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.manual_runs.proof_url IS 'URL to proof screenshot for the manual run';