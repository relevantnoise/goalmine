-- Reset the check-in date for dandlynn@yahoo.com to allow check-in today
-- The user should be able to check in on 2025-08-22 (it's currently 10:30 PM EST on 2025-08-21)
UPDATE goals 
SET last_checkin_date = '2025-08-20'
WHERE user_id = 'e7b1e1d1-9153-4393-902e-68fc07f1fd29' 
  AND last_checkin_date = '2025-08-21';