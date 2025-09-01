-- Fix the remaining function security issue
CREATE OR REPLACE FUNCTION public.send_daily_motivation_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    goal_record RECORD;
    motivation_response JSONB;
    email_response JSONB;
    profile_record RECORD;
BEGIN
    -- Get all active goals that need motivation today
    FOR goal_record IN
        SELECT g.*, p.email, p.id as profile_id
        FROM goals g
        JOIN profiles p ON g.user_id = p.id::text
        WHERE g.is_active = true
          AND (g.last_motivation_date IS NULL OR g.last_motivation_date < CURRENT_DATE)
          AND EXTRACT(HOUR FROM g.time_of_day) <= EXTRACT(HOUR FROM CURRENT_TIME)
          AND EXTRACT(MINUTE FROM g.time_of_day) <= EXTRACT(MINUTE FROM CURRENT_TIME)
    LOOP
        -- Generate fresh AI-powered motivation content for today
        SELECT net.http_post(
            url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
            body := json_build_object(
                'goalId', goal_record.id,
                'goalTitle', goal_record.title,
                'goalDescription', goal_record.description,
                'tone', goal_record.tone,
                'streakCount', goal_record.streak_count,
                'userId', goal_record.user_id
            )::text
        ) INTO motivation_response;

        -- Parse the motivation response
        BEGIN
            -- Send the email with fresh content
            SELECT net.http_post(
                url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
                body := json_build_object(
                    'email', goal_record.email,
                    'name', split_part(goal_record.email, '@', 1),
                    'goal', goal_record.title,
                    'message', COALESCE(motivation_response->'data'->>'message', 'Keep pushing towards your goal!'),
                    'microPlan', COALESCE(
                        array_to_string(ARRAY(
                            SELECT jsonb_array_elements_text(motivation_response->'data'->'microPlan')
                        ), E'\n• '),
                        'Take one step forward today'
                    ),
                    'challenge', COALESCE(motivation_response->'data'->>'challenge', 'Challenge yourself today!'),
                    'streak', goal_record.streak_count
                )::text
            ) INTO email_response;

            -- Update the goal's last motivation date
            UPDATE goals 
            SET last_motivation_date = CURRENT_DATE
            WHERE id = goal_record.id;

            -- Log successful email send
            RAISE LOG 'Generated fresh motivation and sent email for goal % to %', goal_record.title, goal_record.email;

        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other goals
            RAISE LOG 'Failed to generate/send motivation for goal %: %', goal_record.title, SQLERRM;
        END;
    END LOOP;
END;
$$;