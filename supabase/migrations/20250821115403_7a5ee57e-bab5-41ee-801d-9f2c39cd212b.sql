-- Update the check-in function to reset at 3 AM EST (8 AM UTC)
CREATE OR REPLACE FUNCTION public.handle_goal_checkin(goal_id_param uuid, user_id_param text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    goal_record RECORD;
    profile_record RECORD;
    new_streak_count INTEGER;
    today_date DATE;
    current_utc_time TIME;
    result JSON;
    is_milestone BOOLEAN := false;
    milestone_label TEXT;
    days_to_target INTEGER;
BEGIN
    -- Calculate "today" based on 3 AM EST reset (8 AM UTC)
    current_utc_time := CURRENT_TIME;
    IF current_utc_time < TIME '08:00:00' THEN
        -- Before 3 AM EST (8 AM UTC), consider it previous day
        today_date := CURRENT_DATE - INTERVAL '1 day';
    ELSE
        -- After 3 AM EST (8 AM UTC), consider it current day
        today_date := CURRENT_DATE;
    END IF;

    -- Get the current goal
    SELECT * INTO goal_record
    FROM goals 
    WHERE id = goal_id_param 
      AND user_id = user_id_param 
      AND is_active = true;
      
    IF NOT FOUND THEN
        RETURN '{"error": "Goal not found"}'::JSON;
    END IF;
    
    -- Check if already checked in today (based on 3 AM EST reset)
    IF goal_record.last_checkin_date = today_date THEN
        RETURN '{"error": "Already checked in today"}'::JSON;
    END IF;
    
    -- Calculate new streak
    IF goal_record.last_checkin_date IS NULL THEN
        -- First check-in ever
        new_streak_count := 1;
    ELSIF goal_record.last_checkin_date = today_date - INTERVAL '1 day' THEN
        -- Consecutive day
        new_streak_count := COALESCE(goal_record.streak_count, 0) + 1;
    ELSE
        -- Missed days, reset to 1
        new_streak_count := 1;
    END IF;
    
    -- Check for milestone: first time reaching 7-day streak on goals with target > 10 days
    IF new_streak_count = 7 AND COALESCE(goal_record.streak_count, 0) < 7 THEN
        -- Check if goal has sufficient duration (target date > 10 days from creation or today)
        IF goal_record.target_date IS NOT NULL THEN
            days_to_target := goal_record.target_date - goal_record.created_at::date;
            IF days_to_target > 10 THEN
                is_milestone := true;
                milestone_label := '7-Day Streak';
            END IF;
        END IF;
    END IF;
    
    -- Update the goal
    UPDATE goals 
    SET streak_count = new_streak_count,
        last_checkin_date = today_date,
        updated_at = NOW()
    WHERE id = goal_id_param 
      AND user_id = user_id_param;
    
    -- If this is a milestone, get user profile and send milestone email
    IF is_milestone THEN
        SELECT email INTO profile_record FROM profiles WHERE id = user_id_param::uuid;
        
        IF FOUND THEN
            BEGIN
                -- Generate milestone content
                PERFORM public.net.http_post(
                    url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-milestone-content',
                    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
                    body := json_build_object(
                        'goalTitle', goal_record.title,
                        'goalDescription', goal_record.description,
                        'tone', goal_record.tone,
                        'streak', new_streak_count,
                        'targetDate', goal_record.target_date,
                        'milestoneLabel', milestone_label
                    )::text
                );
                
                -- Send milestone email
                PERFORM public.net.http_post(
                    url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-milestone-email',
                    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.4lWJhEJQBOGSGOQ1u7Nwr5xJMq9xA1qLaF2K0k5nRaY"}'::jsonb,
                    body := json_build_object(
                        'email', profile_record.email,
                        'name', split_part(profile_record.email, '@', 1),
                        'goal', goal_record.title,
                        'milestoneLabel', milestone_label,
                        'nextStep', 'Now that you''ve built this incredible 7-day foundation, focus on your next milestone - take one powerful action today that brings you closer to your goal and keeps this winning momentum alive!',
                        'streak', new_streak_count
                    )::text
                );
                
                RAISE LOG 'Sent milestone email for % to %', milestone_label, profile_record.email;
                
            EXCEPTION WHEN OTHERS THEN
                -- Log error but don't fail the check-in
                RAISE LOG 'Failed to send milestone email: %', SQLERRM;
            END;
        END IF;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'streak_count', new_streak_count,
        'milestone', is_milestone,
        'milestone_label', milestone_label,
        'message', CASE 
            WHEN is_milestone THEN 'Incredible! You''ve hit your ' || milestone_label || '! 🏆'
            WHEN new_streak_count = 1 THEN 'Great start! Your journey begins now!'
            ELSE new_streak_count || ' day' || CASE WHEN new_streak_count > 1 THEN 's' ELSE '' END || ' strong! Keep it going!'
        END
    );
END;
$function$;