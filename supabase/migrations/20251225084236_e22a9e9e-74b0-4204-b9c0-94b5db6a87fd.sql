-- Create a table for admin-added manual runs
CREATE TABLE public.manual_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completion_time numeric NOT NULL,
  arrow_name text NOT NULL,
  is_verifier boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone NOT NULL,
  note text,
  added_by_admin_id uuid NOT NULL,
  added_by_admin_email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_runs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Manual runs are viewable by everyone" 
ON public.manual_runs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage manual runs" 
ON public.manual_runs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manual_runs_updated_at
BEFORE UPDATE ON public.manual_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();