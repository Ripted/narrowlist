ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;