-- Create tag_presets table for predefined admin tags
CREATE TABLE public.tag_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emoji TEXT NOT NULL DEFAULT '🏷️',
  text TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tag_presets ENABLE ROW LEVEL SECURITY;

-- Everyone can read tag presets
CREATE POLICY "Tag presets are viewable by everyone"
ON public.tag_presets FOR SELECT
USING (true);

-- Only admins can manage tag presets
CREATE POLICY "Admins can manage tag presets"
ON public.tag_presets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_tag_presets_text ON public.tag_presets(text);