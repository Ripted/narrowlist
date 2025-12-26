-- Add alternative_ids column to levels table for low-detail mode levels
ALTER TABLE public.levels 
ADD COLUMN alternative_ids text[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN public.levels.alternative_ids IS 'Alternative level IDs (e.g., low-detail versions) that count as completions for this level';