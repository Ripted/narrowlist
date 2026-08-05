SELECT cron.schedule(
  'sync-completions-every-3-minutes',
  '*/3 * * * *',
  $j$
  SELECT net.http_post(
    url := 'https://ernuscqjcluitrtyilnc.supabase.co/functions/v1/sync-completions',
    headers := '{"Content-Type": "application/json", "x-internal-secret": "ed2b278e80fb6bfe25cbd0306fe49f9c2b461311792549c06c63cfef0a7a9b04"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $j$
);

SELECT cron.schedule(
  'sync-extra-completions-every-3-minutes',
  '*/3 * * * *',
  $j$
  SELECT net.http_post(
    url := 'https://ernuscqjcluitrtyilnc.supabase.co/functions/v1/sync-extra-completions',
    headers := '{"Content-Type": "application/json", "x-internal-secret": "ed2b278e80fb6bfe25cbd0306fe49f9c2b461311792549c06c63cfef0a7a9b04"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $j$
);