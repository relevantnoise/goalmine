-- STEP 1: DIAGNOSTIC - Check what cron jobs currently exist
-- Copy and paste this into Supabase SQL Editor
-- This is READ-ONLY and makes no changes

-- Check for the specific cron job we expect to find
SELECT 
  jobname,
  schedule,
  active,
  created_at,
  'This is the duplicate email job we need to disable' as note
FROM cron.job 
WHERE jobname = 'daily-motivation-emails';

-- Check for any other email-related cron jobs  
SELECT 
  jobname, 
  schedule, 
  active,
  created_at,
  command,
  'Other email-related cron jobs' as note
FROM cron.job 
WHERE 
  jobname ILIKE '%email%' 
  OR jobname ILIKE '%daily%'
  OR jobname ILIKE '%motivation%'
  OR command ILIKE '%email%'
  OR command ILIKE '%daily-cron%'
ORDER BY created_at DESC;

-- Show all cron jobs for complete picture
SELECT 
  jobname,
  schedule, 
  active,
  created_at,
  'All cron jobs (for reference)' as note
FROM cron.job 
ORDER BY jobname;