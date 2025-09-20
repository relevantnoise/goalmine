-- Update RLS policies for goals table to work with Clerk authentication
DROP POLICY "Users can view own goals" ON goals;
DROP POLICY "Users can create own goals" ON goals;
DROP POLICY "Users can update own goals" ON goals;
DROP POLICY "Users can delete own goals" ON goals;

-- Create new RLS policies that work with Clerk JWT structure
CREATE POLICY "Users can view own goals" 
ON goals 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own goals" 
ON goals 
FOR INSERT 
WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own goals" 
ON goals 
FOR UPDATE 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own goals" 
ON goals 
FOR DELETE 
USING (user_id = auth.jwt() ->> 'sub');

-- Also update motivation_history table policies
DROP POLICY "Users can view own motivation history" ON motivation_history;
DROP POLICY "Users can create own motivation history" ON motivation_history;

CREATE POLICY "Users can view own motivation history" 
ON motivation_history 
FOR SELECT 
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own motivation history" 
ON motivation_history 
FOR INSERT 
WITH CHECK (user_id = auth.jwt() ->> 'sub');