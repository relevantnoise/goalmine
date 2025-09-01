-- Clean up all user data for testing
-- Run these queries in Supabase SQL editor

-- First, let's see what data exists for our test emails
SELECT 'profiles' as table_name, id, email, created_at 
FROM profiles 
WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')

UNION ALL

SELECT 'goals' as table_name, id::text, title, created_at 
FROM goals 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')
)

UNION ALL

SELECT 'subscribers' as table_name, id::text, email, created_at 
FROM subscribers 
WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')

UNION ALL

SELECT 'motivation_history' as table_name, id::text, 
  COALESCE(goal_id::text, 'no_goal') as goal_info, created_at 
FROM motivation_history 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')
);

-- After reviewing the data above, uncomment these DELETE statements to clean up:

/*
-- Delete motivation history first (has foreign key to goals)
DELETE FROM motivation_history 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')
);

-- Delete goals
DELETE FROM goals 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com')
);

-- Delete subscribers
DELETE FROM subscribers 
WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com');

-- Delete profiles last
DELETE FROM profiles 
WHERE email IN ('danlynn@gmail.com', 'dandlynn@yahoo.com');
*/