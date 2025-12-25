-- Give narrow.ripted@gmail.com admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'narrow.ripted@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Give sirsamyou@gmail.com admin role if not already
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'sirsamyou@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove admin role from narrowripted@gmail.com (without dot)
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'narrowripted@gmail.com')
AND role = 'admin';

-- Create admin_changelog table
CREATE TABLE IF NOT EXISTS public.admin_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_changelog ENABLE ROW LEVEL SECURITY;

-- Only admins can view changelog
CREATE POLICY "Admins can view changelog" ON public.admin_changelog
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert changelog
CREATE POLICY "Admins can insert changelog" ON public.admin_changelog
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));