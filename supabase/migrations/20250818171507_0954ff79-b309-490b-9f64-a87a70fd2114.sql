-- Configure Supabase to use custom email templates
-- This disables the default auth emails so our webhook can handle them

-- Update auth.config to use custom email templates
UPDATE auth.config SET 
  custom_sms_template = NULL,
  custom_email_template = NULL,
  email_template = 'confirmation'
WHERE true;

-- Ensure the webhook is properly configured for auth events
INSERT INTO supabase_functions.hooks (hook_table_id, hook_name, type, fnid)
SELECT 
  (SELECT id FROM supabase_functions.hooks WHERE hook_table_id = (SELECT id FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') LIMIT 1) as hook_table_id,
  'send-confirmation-email' as hook_name,
  'http' as type,
  (SELECT id FROM supabase_functions.functions WHERE name = 'send-confirmation-email') as fnid
ON CONFLICT (hook_table_id, hook_name) DO UPDATE SET
  type = EXCLUDED.type,
  fnid = EXCLUDED.fnid;