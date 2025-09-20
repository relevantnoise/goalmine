-- Delete test users and all related data
DO $$
DECLARE
    dandlynn_user_id uuid;
    kejlynn_user_id uuid;
BEGIN
    -- Find the user IDs for the email addresses
    SELECT id INTO dandlynn_user_id 
    FROM auth.users 
    WHERE email = 'dandlynn@yahoo.com';
    
    SELECT id INTO kejlynn_user_id 
    FROM auth.users 
    WHERE email = 'kejlynn@yahoo.com';
    
    -- Delete from goals table (using text user_id)
    IF dandlynn_user_id IS NOT NULL THEN
        DELETE FROM public.goals WHERE user_id = dandlynn_user_id::text;
        DELETE FROM public.motivation_history WHERE user_id = dandlynn_user_id::text;
        DELETE FROM public.subscribers WHERE user_id = dandlynn_user_id::text;
    END IF;
    
    IF kejlynn_user_id IS NOT NULL THEN
        DELETE FROM public.goals WHERE user_id = kejlynn_user_id::text;
        DELETE FROM public.motivation_history WHERE user_id = kejlynn_user_id::text;
        DELETE FROM public.subscribers WHERE user_id = kejlynn_user_id::text;
    END IF;
    
    -- Delete from auth.users (this will cascade delete from profiles table automatically)
    DELETE FROM auth.users WHERE email IN ('dandlynn@yahoo.com', 'kejlynn@yahoo.com');
    
    -- Log the cleanup results
    RAISE NOTICE 'Deleted users dandlynn@yahoo.com and kejlynn@yahoo.com with all related data';
    
END $$;