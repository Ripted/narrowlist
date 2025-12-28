-- Fix discord_notifications foreign key to use CASCADE delete
ALTER TABLE public.discord_notifications DROP CONSTRAINT discord_notifications_level_id_fkey;
ALTER TABLE public.discord_notifications ADD CONSTRAINT discord_notifications_level_id_fkey 
  FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;