-- Create level_tags table to store custom tags for levels
CREATE TABLE public.level_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL,
  level_type TEXT NOT NULL CHECK (level_type IN ('main', 'future', 'extra')),
  emoji TEXT NOT NULL DEFAULT '🏷️',
  text TEXT NOT NULL,
  show_on_card BOOLEAN NOT NULL DEFAULT true,
  show_on_page BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.level_tags ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage level tags" 
ON public.level_tags 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view level tags
CREATE POLICY "Anyone can view level tags" 
ON public.level_tags 
FOR SELECT 
USING (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_level_tags_updated_at
BEFORE UPDATE ON public.level_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_level_tags_level_id ON public.level_tags(level_id);
CREATE INDEX idx_level_tags_level_type ON public.level_tags(level_type);