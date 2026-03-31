
-- Fix duplicate ranks in extended_levels by re-ranking sequentially
-- First, temporarily allow duplicates by dropping any unique constraint on rank_position if it exists
DO $$
BEGIN
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.extended_levels'::regclass 
    AND contype = 'u'
    AND array_to_string(conkey, ',') = (
      SELECT attnum::text FROM pg_attribute 
      WHERE attrelid = 'public.extended_levels'::regclass 
      AND attname = 'rank_position'
    )
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.extended_levels DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.extended_levels'::regclass
      AND contype = 'u'
      AND array_to_string(conkey, ',') = (
        SELECT attnum::text FROM pg_attribute
        WHERE attrelid = 'public.extended_levels'::regclass
        AND attname = 'rank_position'
      )
    );
  END IF;
END $$;

-- Re-rank all extended levels sequentially
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY rank_position, created_at) as new_rank
  FROM public.extended_levels
)
UPDATE public.extended_levels el
SET rank_position = ranked.new_rank
FROM ranked
WHERE el.id = ranked.id;

-- Re-add unique constraint
ALTER TABLE public.extended_levels ADD CONSTRAINT extended_levels_rank_position_unique UNIQUE (rank_position);
