-- Create a new table for Clerk wrapper integration
CREATE TABLE public.clerk_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text,
  last_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clerk_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own clerk record" ON public.clerk_users 
FOR SELECT 
USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create trigger for updated_at
CREATE TRIGGER update_clerk_users_updated_at
BEFORE UPDATE ON public.clerk_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to sync Clerk users to profiles table
CREATE OR REPLACE FUNCTION public.sync_clerk_to_profiles()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync to profiles
CREATE TRIGGER sync_clerk_users_to_profiles
AFTER INSERT OR UPDATE ON public.clerk_users
FOR EACH ROW
EXECUTE FUNCTION public.sync_clerk_to_profiles();