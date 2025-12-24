-- Create future_levels table for unbeaten levels
CREATE TABLE public.future_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id TEXT NOT NULL UNIQUE,
  name TEXT,
  author TEXT,
  rank_position INTEGER NOT NULL,
  points INTEGER NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.future_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Future levels are viewable by everyone" ON public.future_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage future levels" ON public.future_levels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));