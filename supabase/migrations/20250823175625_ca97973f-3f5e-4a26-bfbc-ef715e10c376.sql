-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to send daily motivation emails every hour
-- This will check if any goals need their daily motivation email
SELECT cron.schedule(
  'daily-motivation-emails',
  '0 * * * *', -- Every hour at the top of the hour
  $$
  SELECT
    net.http_post(
        url:='https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);