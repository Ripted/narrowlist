-- Create level_feedback table
CREATE TABLE public.level_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('overrated', 'fair', 'underrated', 'not_worthy')),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level_id, user_id)
);

-- Enable RLS
ALTER TABLE public.level_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Feedback is viewable by admins"
ON public.level_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own feedback"
ON public.level_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create feedback"
ON public.level_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.level_feedback
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
ON public.level_feedback
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
ON public.level_feedback
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_level_feedback_updated_at
BEFORE UPDATE ON public.level_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Store last known rank position to detect 5+ spot movements
ALTER TABLE public.level_feedback ADD COLUMN level_rank_at_feedback INTEGER;