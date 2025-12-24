-- Add bio column to profiles for player descriptions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add unique constraint on profile_claim_requests so users can only claim one profile each
CREATE UNIQUE INDEX IF NOT EXISTS profile_claim_requests_user_id_unique ON public.profile_claim_requests (user_id) WHERE status = 'pending';