-- Complete database cleanup script
-- This will delete ALL user data to provide a clean slate for testing

-- Delete all motivation_history first (has foreign keys to goals and users)
DELETE FROM motivation_history;

-- Delete all goals (has foreign keys to users)
DELETE FROM goals;

-- Delete all subscribers
DELETE FROM subscribers;  

-- Delete all profiles (root user table)
DELETE FROM profiles;

-- Verify cleanup
SELECT 'profiles' as table_name, COUNT(*) as remaining_records FROM profiles
UNION ALL
SELECT 'goals', COUNT(*) FROM goals  
UNION ALL
SELECT 'motivation_history', COUNT(*) FROM motivation_history
UNION ALL  
SELECT 'subscribers', COUNT(*) FROM subscribers;