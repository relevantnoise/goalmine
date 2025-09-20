-- Add a temporary uuid column to profiles for Clerk wrapper compatibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_uuid uuid DEFAULT gen_random_uuid();

-- Make it unique for Clerk wrapper
ALTER TABLE public.profiles ADD CONSTRAINT profiles_clerk_uuid_unique UNIQUE (clerk_uuid);