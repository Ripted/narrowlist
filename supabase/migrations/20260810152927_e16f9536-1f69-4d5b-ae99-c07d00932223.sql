INSERT INTO public.user_roles (user_id, role)
VALUES ('cd415ec7-9c3d-465a-9269-446065663888', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;