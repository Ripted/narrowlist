-- Create level_submissions table for player level submissions
CREATE TABLE public.level_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id TEXT NOT NULL,
  level_name TEXT,
  author TEXT,
  thumbnail_url TEXT,
  suggested_rank INTEGER NOT NULL,
  final_rank INTEGER,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_by_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.level_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view submissions"
ON public.level_submissions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can submit levels"
ON public.level_submissions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage submissions"
ON public.level_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_level_submissions_updated_at
BEFORE UPDATE ON public.level_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();