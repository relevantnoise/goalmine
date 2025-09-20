-- Update goals table to use TEXT for user_id instead of UUID
ALTER TABLE public.goals 
ALTER COLUMN user_id TYPE TEXT;

-- Update motivation_history table to use TEXT for user_id instead of UUID  
ALTER TABLE public.motivation_history 
ALTER COLUMN user_id TYPE TEXT;

-- Update any other tables that might have user_id as UUID
-- If profiles table exists, update it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;