-- Create extended_levels table for levels that dropped out of main list
CREATE TABLE public.extended_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id TEXT NOT NULL UNIQUE,
  name TEXT,
  author TEXT,
  creators TEXT[] DEFAULT '{}',
  rank_position INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  thumbnail_url TEXT,
  verifier_profile_id UUID REFERENCES public.profiles(id),
  alternative_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extended_levels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Extended levels are viewable by everyone" 
ON public.extended_levels 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage extended levels" 
ON public.extended_levels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));