
-- Creator points configuration (singleton row)
CREATE TABLE IF NOT EXISTS public.creator_points_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  main_rating_multiplier numeric NOT NULL DEFAULT 1,
  extra_flat_points numeric NOT NULL DEFAULT 1,
  default_unrated_rating numeric NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.creator_points_config TO anon, authenticated;
GRANT ALL ON public.creator_points_config TO service_role;

ALTER TABLE public.creator_points_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view creator points config" ON public.creator_points_config;
CREATE POLICY "Anyone can view creator points config"
  ON public.creator_points_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update creator points config" ON public.creator_points_config;
CREATE POLICY "Admins can update creator points config"
  ON public.creator_points_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert creator points config" ON public.creator_points_config;
CREATE POLICY "Admins can insert creator points config"
  ON public.creator_points_config FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()));

INSERT INTO public.creator_points_config (id, main_rating_multiplier, extra_flat_points, default_unrated_rating)
VALUES (true, 1, 1, 5)
ON CONFLICT (id) DO NOTHING;

-- Backfill thumbnails from Narrow Arrow embedded image, except TapTapDash
UPDATE public.levels
SET thumbnail_url = 'https://api.narrowarrow.xyz/level-image/' || level_id || '.png'
WHERE lower(coalesce(name, '')) <> 'taptapdash';

UPDATE public.extended_levels
SET thumbnail_url = 'https://api.narrowarrow.xyz/level-image/' || level_id || '.png'
WHERE lower(coalesce(name, '')) <> 'taptapdash';

UPDATE public.future_levels
SET thumbnail_url = 'https://api.narrowarrow.xyz/level-image/' || level_id || '.png'
WHERE lower(coalesce(name, '')) <> 'taptapdash';
