-- Disable automatic email confirmations from Supabase Auth
-- This prevents Supabase from sending confirmation emails automatically
-- Users will only receive the motivational email when creating goals

-- Update auth settings to disable email confirmations
UPDATE auth.config SET enable_confirmations = false WHERE constraint_name = 'email_confirm';