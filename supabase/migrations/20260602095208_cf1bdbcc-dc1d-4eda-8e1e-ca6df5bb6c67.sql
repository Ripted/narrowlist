REVOKE EXECUTE ON FUNCTION public.normalize_level_ranks(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.normalize_level_ranks(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_main_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_extra_level(text, text, text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_future_level(text, text, text, integer, text) TO authenticated, service_role;