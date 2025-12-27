-- Table to track which completions have been notified to Discord
-- This prevents duplicate notifications
CREATE TABLE public.discord_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  completion_type text NOT NULL, -- 'api' or 'manual'
  completion_id text NOT NULL, -- run_id for API, manual_run id for manual
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  level_id uuid NOT NULL REFERENCES public.levels(id),
  notified_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(completion_type, completion_id)
);

-- Enable Row Level Security
ALTER TABLE public.discord_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
CREATE POLICY "Admins can manage notifications"
ON public.discord_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view notifications (for checking if already sent)
CREATE POLICY "Anyone can view notifications"
ON public.discord_notifications
FOR SELECT
USING (true);

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can insert notifications"
ON public.discord_notifications
FOR INSERT
WITH CHECK (true);