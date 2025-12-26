-- Create run submissions table for user-submitted runs
CREATE TABLE public.run_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    level_id TEXT NOT NULL,
    level_name TEXT,
    username TEXT NOT NULL,
    is_verifier BOOLEAN NOT NULL DEFAULT false,
    proof_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    submitted_by UUID,
    submitted_by_email TEXT NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.run_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view run submissions"
ON public.run_submissions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can submit runs"
ON public.run_submissions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage run submissions"
ON public.run_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_run_submissions_updated_at
BEFORE UPDATE ON public.run_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();