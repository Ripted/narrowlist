-- Create function to check if user is head admin (using user_id comparison for now)
CREATE OR REPLACE FUNCTION public.is_head_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = '40674720-de67-4ee0-acef-6dff6673d3a4'::uuid
$$;

-- Allow head admin to manage all user roles
DROP POLICY IF EXISTS "Head admins can manage all roles" ON public.user_roles;
CREATE POLICY "Head admins can manage all roles"
ON public.user_roles
FOR ALL
USING (is_head_admin(auth.uid()))
WITH CHECK (is_head_admin(auth.uid()));