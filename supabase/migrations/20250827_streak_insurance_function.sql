-- Enhanced check-in function with streak insurance system
-- Replaces the existing handle_goal_checkin function

CREATE OR REPLACE FUNCTION public.handle_goal_checkin_with_recovery(
  goal_id_param UUID,
  user_id_param TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record RECORD;
  profile_record RECORD;
  new_streak_count INTEGER;
  today_date DATE;
  current_eastern_time TIMESTAMPTZ;
  days_missed INTEGER;
  insurance_used BOOLEAN := false;
  insurance_earned BOOLEAN := false;
  is_milestone BOOLEAN := false;
  milestone_label TEXT;
  days_to_target INTEGER;
  result JSON;
BEGIN
  -- Get current time in Eastern timezone and calculate today_date with 3 AM reset
  current_eastern_time := NOW() AT TIME ZONE 'America/New_York';
  
  IF EXTRACT(HOUR FROM current_eastern_time) < 3 THEN
    -- Before 3 AM EST, consider it the previous day for check-in purposes
    today_date := (current_eastern_time - INTERVAL '1 day')::DATE;
  ELSE
    -- After 3 AM EST, consider it the current day
    today_date := current_eastern_time::DATE;
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
  
  -- Check if on planned break
  IF goal_record.is_on_planned_break AND goal_record.planned_break_until IS NOT NULL THEN
    IF today_date <= goal_record.planned_break_until THEN
      RETURN '{"error": "Goal is on planned break", "break_until": "' || goal_record.planned_break_until || '"}'::JSON;
    ELSE
      -- Break period ended, remove break status
      UPDATE goals 
      SET is_on_planned_break = false, 
          planned_break_until = NULL 
      WHERE id = goal_id_param;
    END IF;
  END IF;
  
  -- Check if already checked in today (based on 3 AM EST reset)
  IF goal_record.last_checkin_date = today_date THEN
    RETURN '{"error": "Already checked in today"}'::JSON;
  END IF;
  
  -- Calculate new streak with insurance logic
  IF goal_record.last_checkin_date IS NULL THEN
    -- First check-in ever
    new_streak_count := 1;
  ELSE
    days_missed := today_date - goal_record.last_checkin_date - 1;
    
    IF days_missed = 0 THEN
      -- Consecutive day (yesterday)
      new_streak_count := COALESCE(goal_record.streak_count, 0) + 1;
    ELSIF days_missed > 0 AND COALESCE(goal_record.streak_insurance_days, 0) > 0 THEN
      -- Missed days but have insurance
      IF days_missed <= goal_record.streak_insurance_days THEN
        -- Insurance covers all missed days
        new_streak_count := COALESCE(goal_record.streak_count, 0) + 1;
        insurance_used := true;
        
        -- Log recovery before updating goal
        INSERT INTO streak_recoveries (goal_id, user_id, recovery_date, streak_before, recovery_type, days_recovered)
        VALUES (goal_id_param, user_id_param, today_date, goal_record.streak_count, 'insurance', days_missed);
        
        -- Deduct insurance days
        UPDATE goals 
        SET streak_insurance_days = streak_insurance_days - days_missed
        WHERE id = goal_id_param;
      ELSE
        -- Insurance doesn't cover all days - reset streak
        new_streak_count := 1;
      END IF;
    ELSE
      -- No insurance or insurance insufficient - reset streak
      new_streak_count := 1;
    END IF;
  END IF;
  
  -- Award insurance every 7 days (max 3)
  IF new_streak_count % 7 = 0 AND new_streak_count > 0 THEN
    -- Only award if we don't already have max insurance
    IF COALESCE(goal_record.streak_insurance_days, 0) < 3 THEN
      UPDATE goals 
      SET streak_insurance_days = LEAST(COALESCE(streak_insurance_days, 0) + 1, 3),
          last_insurance_earned_at = today_date
      WHERE id = goal_id_param;
      insurance_earned := true;
    END IF;
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
  
  -- If this is a milestone, handle milestone email (same as before)
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
            'streak', new_streak_count
          )::text
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the check-in
        RAISE NOTICE 'Error sending milestone email: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Get updated insurance count for response
  SELECT streak_insurance_days INTO goal_record FROM goals WHERE id = goal_id_param;
  
  -- Build result JSON
  result := json_build_object(
    'success', true,
    'streak_count', new_streak_count,
    'insurance_used', insurance_used,
    'insurance_earned', insurance_earned,
    'insurance_days_remaining', COALESCE(goal_record.streak_insurance_days, 0),
    'days_recovered', CASE WHEN insurance_used THEN days_missed ELSE 0 END,
    'is_milestone', is_milestone,
    'milestone_label', milestone_label
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_goal_checkin_with_recovery(UUID, TEXT) TO authenticated;

-- Add this function to the RPC functions available to clients
-- (This will be picked up when we regenerate the Supabase types)