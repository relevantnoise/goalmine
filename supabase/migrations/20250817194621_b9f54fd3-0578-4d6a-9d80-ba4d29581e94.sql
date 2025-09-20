-- Create a simpler working version of the daily email function
CREATE OR REPLACE FUNCTION public.send_daily_motivation_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    goal_record RECORD;
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
        BEGIN
            -- For now, send a simple motivation email
            PERFORM public.net.http_post(
                url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
                body := json_build_object(
                    'email', goal_record.email,
                    'name', split_part(goal_record.email, '@', 1),
                    'goal', goal_record.title,
                    'message', 'Today is another opportunity to make progress on your goal: ' || goal_record.title || '. Keep building momentum!',
                    'microPlan', 'Take one small action toward your goal today' || E'\n• ' || 'Document your progress, however small' || E'\n• ' || 'Reflect on how far you have already come',
                    'challenge', 'Right now, take 30 seconds to visualize yourself achieving this goal.',
                    'streak', goal_record.streak_count
                )::text
            );

            -- Update the goal's last motivation date
            UPDATE goals 
            SET last_motivation_date = CURRENT_DATE
            WHERE id = goal_record.id;

            -- Log successful email send
            RAISE LOG 'Sent daily motivation email for goal % to %', goal_record.title, goal_record.email;

        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other goals
            RAISE LOG 'Failed to send motivation for goal %: %', goal_record.title, SQLERRM;
        END;
    END LOOP;
END;
$$;