-- Fix duplicated level_rank_history rows.
--
-- The original triggers on_level_rank_change / on_level_created (created in
-- 20251228000938) were never dropped when handle_level_rank_change_trigger /
-- handle_level_created_trigger were added in 20260301074231. Both pairs call
-- the same functions, so every rank change and level insert has been written
-- twice since then. Drop the legacy pair and delete the duplicate rows.

DROP TRIGGER IF EXISTS on_level_rank_change ON public.levels;
DROP TRIGGER IF EXISTS on_level_created ON public.levels;

-- Remove exact duplicate history rows, keeping the earliest row per group.
-- Duplicates share recorded_at exactly because both triggers run in the same
-- transaction (now() is the transaction timestamp).
DELETE FROM public.level_rank_history a
USING public.level_rank_history b
WHERE a.id > b.id
  AND a.level_id = b.level_id
  AND a.recorded_at = b.recorded_at
  AND a.rank_position = b.rank_position
  AND a.points = b.points
  AND a.previous_rank IS NOT DISTINCT FROM b.previous_rank;
