-- Fix the is_head_admin function to use correct emails only
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

-- Remove admin role from narrowripted@gmail.com if it exists
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'narrowripted@gmail.com'
)
AND role = 'admin';