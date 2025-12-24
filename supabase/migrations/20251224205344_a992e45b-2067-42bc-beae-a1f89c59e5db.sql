-- Add banner_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Create profile claim requests table
CREATE TABLE public.profile_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  UNIQUE(profile_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profile_claim_requests ENABLE ROW LEVEL SECURITY;

-- Policies for claim requests
CREATE POLICY "Users can view their own claim requests" 
ON public.profile_claim_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create claim requests" 
ON public.profile_claim_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all claim requests" 
ON public.profile_claim_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update claim requests" 
ON public.profile_claim_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete claim requests" 
ON public.profile_claim_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update is_head_admin function to include both permanent admins
CREATE OR REPLACE FUNCTION public.is_head_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email IN ('sirsamyou@gmail.com', 'narrow.ripted@gmail.com')
  )
$$;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);