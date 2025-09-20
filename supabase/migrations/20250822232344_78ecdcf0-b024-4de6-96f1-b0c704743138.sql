-- Create or update the clerk_users trigger to sync with profiles
CREATE OR REPLACE FUNCTION public.sync_clerk_to_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the profiles table when clerk_users changes
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.clerk_user_id, NEW.email, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync clerk users to profiles
DROP TRIGGER IF EXISTS sync_clerk_users_to_profiles ON public.clerk_users;
CREATE TRIGGER sync_clerk_users_to_profiles
  AFTER INSERT OR UPDATE ON public.clerk_users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_clerk_to_profiles();