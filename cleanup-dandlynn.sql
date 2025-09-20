-- Complete cleanup of dandlynn@yahoo.com from database
-- Run this in production and dev environments

-- Delete motivation_history first (has foreign keys)
DELETE FROM motivation_history WHERE user_id = 'dandlynn@yahoo.com';

-- Delete goals next
DELETE FROM goals WHERE user_id = 'dandlynn@yahoo.com';

-- Delete daily_nudges records  
DELETE FROM daily_nudges WHERE user_id = 'dandlynn@yahoo.com';

-- Delete subscribers (both by user_id and email)
DELETE FROM subscribers WHERE user_id = 'dandlynn@yahoo.com' OR email = 'dandlynn@yahoo.com';

-- Delete profiles by email
DELETE FROM profiles WHERE email = 'dandlynn@yahoo.com';

-- Verify cleanup
SELECT 
  'motivation_history' as table_name,
  COUNT(*) as remaining_records
FROM motivation_history 
WHERE user_id = 'dandlynn@yahoo.com'
UNION ALL
SELECT 
  'goals' as table_name,
  COUNT(*) as remaining_records
FROM goals 
WHERE user_id = 'dandlynn@yahoo.com'
UNION ALL
SELECT 
  'daily_nudges' as table_name,
  COUNT(*) as remaining_records
FROM daily_nudges 
WHERE user_id = 'dandlynn@yahoo.com'
UNION ALL
SELECT 
  'subscribers' as table_name,
  COUNT(*) as remaining_records
FROM subscribers 
WHERE user_id = 'dandlynn@yahoo.com' OR email = 'dandlynn@yahoo.com'
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as remaining_records
FROM profiles 
WHERE email = 'dandlynn@yahoo.com';

-- Final confirmation
SELECT 'dandlynn@yahoo.com completely cleaned!' as status;