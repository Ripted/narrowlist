DO $$
DECLARE
  fn record;
  keep_authenticated text[] := ARRAY['has_role','is_head_admin','claim_or_create_profile','user_has_completed_level',
    'admin_add_main_level','admin_add_extra_level','admin_add_future_level','admin_hard_delete_profile',
    'admin_restore_profile','normalize_level_ranks','cleanup_empty_unclaimed_profiles',
    'recalculate_all_extra_points','recalculate_player_points','recalculate_player_extra_points'];
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    IF fn.proname = ANY(keep_authenticated) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
    ELSE
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.sig);
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;