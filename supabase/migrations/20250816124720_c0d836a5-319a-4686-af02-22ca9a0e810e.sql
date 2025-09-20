-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to send daily motivation emails
CREATE OR REPLACE FUNCTION send_daily_motivation_emails()
RETURNS void AS $$
DECLARE
    goal_record RECORD;
    user_profile RECORD;
    motivation_record RECORD;
    function_response TEXT;
BEGIN
    -- Get all active goals that need motivation today
    FOR goal_record IN
        SELECT g.*, p.email, p.id as profile_id
        FROM goals g
        JOIN profiles p ON g.user_id = p.id::text
        WHERE g.is_active = true
          AND (g.last_motivation_date IS NULL OR g.last_motivation_date < CURRENT_DATE)
          AND EXTRACT(HOUR FROM g.time_of_day) = EXTRACT(HOUR FROM CURRENT_TIME AT TIME ZONE 'EST')
          AND EXTRACT(MINUTE FROM g.time_of_day) <= EXTRACT(MINUTE FROM CURRENT_TIME AT TIME ZONE 'EST')
    LOOP
        -- Get the latest motivation for this goal
        SELECT * INTO motivation_record
        FROM motivation_history
        WHERE goal_id = goal_record.id
          AND user_id = goal_record.user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- If we have motivation content, send the email
        IF motivation_record.id IS NOT NULL THEN
            -- Call the send-motivation-email edge function
            SELECT net.http_post(
                url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
                body := json_build_object(
                    'email', goal_record.email,
                    'name', split_part(goal_record.email, '@', 1),
                    'goal', goal_record.title,
                    'message', motivation_record.message,
                    'microPlan', motivation_record.micro_plan::text,
                    'challenge', motivation_record.challenge,
                    'streak', goal_record.streak_count
                )::text
            ) INTO function_response;

            -- Update the goal's last motivation date
            UPDATE goals 
            SET last_motivation_date = CURRENT_DATE
            WHERE id = goal_record.id;

            -- Log the email send attempt
            RAISE LOG 'Sent motivation email for goal % to %', goal_record.title, goal_record.email;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run every hour to check for emails to send
SELECT cron.schedule(
    'send-daily-motivation-emails',
    '0 * * * *', -- Every hour at minute 0
    'SELECT send_daily_motivation_emails();'
);