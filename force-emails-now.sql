-- EMERGENCY: Reset email dates so emails can be sent immediately
UPDATE goals 
SET last_motivation_date = NULL 
WHERE user_id IN ('danlynn@gmail.com', 'dandlynn@yahoo.com') 
  AND is_active = true
  AND last_motivation_date = '2025-09-29';

-- Verify the reset worked
SELECT id, title, user_id, last_motivation_date, is_active 
FROM goals 
WHERE user_id IN ('danlynn@gmail.com', 'dandlynn@yahoo.com');