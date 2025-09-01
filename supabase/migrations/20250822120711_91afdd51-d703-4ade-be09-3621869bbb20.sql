-- Remove the existing cron job that calls the database function
SELECT cron.unschedule('send-daily-motivation-emails');

-- Create a new cron job that calls the edge function instead
SELECT cron.schedule(
  'send-daily-emails',
  '0 6-23 * * *', -- Every hour from 6 AM to 11 PM Eastern
  $$
  SELECT
    net.http_post(
        url:='https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Optional: You can also manually trigger it now to test
SELECT
  net.http_post(
      url:='https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
      body:='{}'::jsonb
  ) as manual_trigger;