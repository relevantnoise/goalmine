-- Setup Supabase cron job for daily emails at 7 AM Eastern
-- Run this in Supabase SQL Editor

-- Remove any existing cron jobs for daily emails
SELECT cron.unschedule('daily-motivation-emails');

-- Schedule new cron job at 11:00 UTC (7:00 AM EDT / 6:00 AM EST)
SELECT cron.schedule(
  'daily-motivation-emails',
  '0 11 * * *',
  'SELECT net.http_post(
    url := ''https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}''::jsonb,
    body := ''{}''::jsonb
  );'
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-motivation-emails';