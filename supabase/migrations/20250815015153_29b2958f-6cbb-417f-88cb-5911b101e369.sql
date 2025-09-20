-- Re-enable RLS on goals table and fix policies for Clerk JWT
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

-- Create new policies that correctly interpret Clerk JWT sub claim
CREATE POLICY "Users can view own goals" ON public.goals
FOR SELECT
USING (user_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Users can create own goals" ON public.goals
FOR INSERT
WITH CHECK (user_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Users can update own goals" ON public.goals
FOR UPDATE
USING (user_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Users can delete own goals" ON public.goals
FOR DELETE
USING (user_id = (auth.jwt() ->> 'sub'::text));