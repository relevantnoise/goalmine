-- Create or replace the goal check-in function with proper timezone handling
CREATE OR REPLACE FUNCTION public.handle_goal_checkin(
  goal_id_param UUID,
  user_id_param TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_record RECORD;
  current_eastern_date DATE;
  current_eastern_time TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Get current time in Eastern timezone
  current_eastern_time := NOW() AT TIME ZONE 'America/New_York';
  
  -- If it's before 3 AM Eastern, consider it the previous day for check-in purposes
  IF EXTRACT(HOUR FROM current_eastern_time) < 3 THEN
    current_eastern_date := (current_eastern_time - INTERVAL '1 day')::DATE;
  ELSE
    current_eastern_date := current_eastern_time::DATE;
  END IF;
  
  -- Get the goal and verify ownership
  SELECT * INTO goal_record
  FROM goals
  WHERE id = goal_id_param AND user_id = user_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Goal not found or access denied');
  END IF;
  
  -- Check if already checked in today (using Eastern timezone logic)
  IF goal_record.last_checkin_date = current_eastern_date THEN
    RETURN json_build_object('error', 'Already checked in today');
  END IF;
  
  -- Update the goal with new check-in date and increment streak
  UPDATE goals
  SET 
    last_checkin_date = current_eastern_date,
    streak_count = CASE 
      -- If last check-in was yesterday, increment streak
      WHEN goal_record.last_checkin_date = current_eastern_date - INTERVAL '1 day' THEN goal_record.streak_count + 1
      -- If last check-in was today (shouldn't happen due to check above) or more than 1 day ago, start new streak
      ELSE 1
    END,
    updated_at = NOW()
  WHERE id = goal_id_param;
  
  -- Get the updated streak count
  SELECT streak_count INTO result
  FROM goals
  WHERE id = goal_id_param;
  
  RETURN json_build_object('success', true, 'streak_count', result, 'check_in_date', current_eastern_date);
END;
$$;