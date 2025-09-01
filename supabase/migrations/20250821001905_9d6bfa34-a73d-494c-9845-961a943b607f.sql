-- Fix search path security issue for the trial function
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    profile_record RECORD;
    subscriber_record RECORD;
BEGIN
    -- Get user profile
    SELECT * INTO profile_record 
    FROM public.profiles 
    WHERE id = user_id;
    
    -- If no profile found, consider trial expired
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has active subscription
    SELECT * INTO subscriber_record 
    FROM public.subscribers 
    WHERE user_id::text = user_id::text AND subscribed = true;
    
    -- If user has active subscription, trial is not relevant
    IF FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if trial has expired
    RETURN (profile_record.trial_expires_at < NOW());
END;
$$;