-- Add verifier column to levels table
ALTER TABLE public.levels 
ADD COLUMN verifier_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.levels.verifier_profile_id IS 'The profile ID of the player who verified this level';