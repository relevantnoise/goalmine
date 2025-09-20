-- Add last_checkin_date to track when user last checked in
ALTER TABLE goals 
ADD COLUMN last_checkin_date date;

-- Update existing goals to have a reasonable last_checkin_date based on created_at
UPDATE goals 
SET last_checkin_date = created_at::date 
WHERE last_checkin_date IS NULL AND created_at IS NOT NULL;