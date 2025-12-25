-- Add country column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN country_code VARCHAR(2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.country_code IS 'ISO 3166-1 alpha-2 country code';