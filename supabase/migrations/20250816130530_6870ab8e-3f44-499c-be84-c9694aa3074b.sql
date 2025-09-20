-- Fix existing streak counts that are 0 but have today's check-in date
UPDATE goals 
SET streak_count = 1 
WHERE last_checkin_date = CURRENT_DATE 
  AND streak_count = 0 
  AND is_active = true;

-- Create a better check-in function that handles edge cases
CREATE OR REPLACE FUNCTION handle_goal_checkin(goal_id_param UUID, user_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    goal_record RECORD;
    new_streak_count INTEGER;
    today_date DATE := CURRENT_DATE;
    result JSON;
BEGIN
    -- Get the current goal
    SELECT * INTO goal_record
    FROM goals 
    WHERE id = goal_id_param 
      AND user_id = user_id_param 
      AND is_active = true;
      
    IF NOT FOUND THEN
        RETURN '{"error": "Goal not found"}'::JSON;
    END IF;
    
    -- Check if already checked in today
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
    
    -- Update the goal
    UPDATE goals 
    SET streak_count = new_streak_count,
        last_checkin_date = today_date,
        updated_at = NOW()
    WHERE id = goal_id_param 
      AND user_id = user_id_param;
    
    RETURN json_build_object(
        'success', true,
        'streak_count', new_streak_count,
        'message', CASE 
            WHEN new_streak_count = 1 THEN 'Great start! Your journey begins now!'
            ELSE new_streak_count || ' day' || CASE WHEN new_streak_count > 1 THEN 's' ELSE '' END || ' strong! Keep it going!'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;