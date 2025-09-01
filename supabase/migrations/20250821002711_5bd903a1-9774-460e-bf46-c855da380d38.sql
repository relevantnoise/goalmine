-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to send daily motivation emails every hour
-- This runs every hour and the function internally checks if it's time to send emails
SELECT cron.schedule(
  'daily-motivation-emails',
  '0 * * * *', -- Run every hour at the top of the hour
  $$
  SELECT public.send_daily_motivation_emails();
  $$
);

-- Also create a more frequent check during peak hours (6 AM to 10 PM)
SELECT cron.schedule(
  'frequent-motivation-check',
  '*/30 6-22 * * *', -- Every 30 minutes between 6 AM and 10 PM
  $$
  SELECT public.send_daily_motivation_emails();
  $$
);