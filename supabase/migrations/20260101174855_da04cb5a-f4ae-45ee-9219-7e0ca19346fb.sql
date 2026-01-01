-- Add creators array column to levels table (for multiple creators)
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS creators text[] DEFAULT '{}';

-- Add creators array column to future_levels table
ALTER TABLE public.future_levels ADD COLUMN IF NOT EXISTS creators text[] DEFAULT '{}';

-- Add creators array column to deleted_levels table
ALTER TABLE public.deleted_levels ADD COLUMN IF NOT EXISTS creators text[] DEFAULT '{}';