SELECT cron.schedule(
  'sync-extra-completions-every-3-minutes',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ernuscqjcluitrtyilnc.supabase.co/functions/v1/sync-extra-completions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybnVzY3FqY2x1aXRydHlpbG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzg4MjAsImV4cCI6MjA4MjE1NDgyMH0.R500iwxkoabydl6oRNwd5VGSvA134mIMgehHn9LX1U8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Also recalculate everyone's extra_points immediately so existing data is reflected
SELECT public.recalculate_all_extra_points();