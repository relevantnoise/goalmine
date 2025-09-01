-- Fix the goal check-in date to allow the user to check in today
-- This goal was checked in on 2025-08-21 but should be able to check in on 2025-08-22
UPDATE goals 
SET last_checkin_date = '2025-08-20'
WHERE id = 'd83cf67d-397f-443d-88a5-37899b8558ad' 
  AND user_id = 'e7b1e1d1-9153-4393-902e-68fc07f1fd29'
  AND last_checkin_date = '2025-08-21';