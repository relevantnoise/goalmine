-- Update goals RLS policies to use Supabase auth instead of Clerk JWT
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- Create new policies using auth.uid() for Supabase auth
CREATE POLICY "Users can view own goals" 
ON goals 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own goals" 
ON goals 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own goals" 
ON goals 
FOR UPDATE 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own goals" 
ON goals 
FOR DELETE 
USING (user_id = auth.uid()::text);

-- Update motivation_history RLS policies too
DROP POLICY IF EXISTS "Users can view own motivation history" ON motivation_history;
DROP POLICY IF EXISTS "Users can create own motivation history" ON motivation_history;

CREATE POLICY "Users can view own motivation history" 
ON motivation_history 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own motivation history" 
ON motivation_history 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);