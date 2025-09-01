-- COMPLETE DATABASE CLEANUP - Remove ALL user data for fresh start
-- This will delete everything from all user-related tables

-- First, let's see what data exists across all tables
SELECT 'Current data summary:' as info;

SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'goals' as table_name, COUNT(*) as record_count FROM goals
UNION ALL
SELECT 'motivation_history' as table_name, COUNT(*) as record_count FROM motivation_history
UNION ALL
SELECT 'subscribers' as table_name, COUNT(*) as record_count FROM subscribers;

-- Show sample of existing data (if any)
SELECT 'Sample profiles:' as info;
SELECT id, email, created_at FROM profiles LIMIT 5;

SELECT 'Sample goals:' as info;
SELECT id, user_id, title, created_at FROM goals LIMIT 5;

SELECT 'Sample motivation_history:' as info;
SELECT id, user_id, goal_id, created_at FROM motivation_history LIMIT 5;

SELECT 'Sample subscribers:' as info;
SELECT id, email, created_at FROM subscribers LIMIT 5;

-- COMPLETE CLEANUP - DELETE ALL USER DATA
-- Delete in proper order to respect foreign key constraints

-- 1. Delete all motivation history (references goals and users)
DELETE FROM motivation_history;

-- 2. Delete all goals (references users)
DELETE FROM goals;

-- 3. Delete all subscribers (independent table)
DELETE FROM subscribers;

-- 4. Delete all profiles (root user table)
DELETE FROM profiles;

-- Reset any sequences/auto-increment counters (if they exist)
-- This ensures new records start with clean IDs
-- Note: Supabase uses UUIDs by default, so this may not be necessary

-- Verify cleanup completed
SELECT 'After cleanup - record counts:' as info;

SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'goals' as table_name, COUNT(*) as record_count FROM goals
UNION ALL
SELECT 'motivation_history' as table_name, COUNT(*) as record_count FROM motivation_history
UNION ALL
SELECT 'subscribers' as table_name, COUNT(*) as record_count FROM subscribers;

SELECT 'Database cleanup complete! All user data removed.' as result;