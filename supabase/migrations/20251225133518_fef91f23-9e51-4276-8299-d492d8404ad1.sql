-- Create table for users banned from submitting levels
CREATE TABLE public.submission_banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  banned_by UUID NOT NULL,
  banned_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_banned_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage bans
CREATE POLICY "Admins can manage submission bans"
ON public.submission_banned_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can check if they are banned (for the submission page)
CREATE POLICY "Users can check their own ban status"
ON public.submission_banned_users
FOR SELECT
USING (auth.uid() = user_id);

-- Add unique constraint on user_id to prevent duplicate bans
ALTER TABLE public.submission_banned_users ADD CONSTRAINT unique_banned_user UNIQUE (user_id);