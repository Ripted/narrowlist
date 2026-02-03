-- Fix linter: remove overly permissive INSERT policies

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- discord_notifications
ALTER TABLE public.discord_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.discord_notifications;

-- webhook_settings: remove public read access (keep existing admin-only policy)
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view webhook settings" ON public.webhook_settings;