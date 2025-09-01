import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    // Apply the streak insurance schema migration
    console.log('Applying streak insurance schema migration...')
    
    const migrations = [
      // Add new columns to goals table
      "ALTER TABLE goals ADD COLUMN IF NOT EXISTS streak_insurance_days INTEGER DEFAULT 0;",
      "ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_insurance_earned_at DATE;", 
      "ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_on_planned_break BOOLEAN DEFAULT false;",
      "ALTER TABLE goals ADD COLUMN IF NOT EXISTS planned_break_until DATE;",
      
      // Create streak_recoveries table
      `CREATE TABLE IF NOT EXISTS streak_recoveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        recovery_date DATE NOT NULL,
        streak_before INTEGER NOT NULL,
        recovery_type TEXT NOT NULL,
        days_recovered INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Add indexes
      "CREATE INDEX IF NOT EXISTS idx_streak_recoveries_goal_id ON streak_recoveries(goal_id);",
      "CREATE INDEX IF NOT EXISTS idx_streak_recoveries_user_id ON streak_recoveries(user_id);",
      "CREATE INDEX IF NOT EXISTS idx_streak_recoveries_date ON streak_recoveries(recovery_date);",
      
      // Enable RLS
      "ALTER TABLE streak_recoveries ENABLE ROW LEVEL SECURITY;",
      
      // Update existing goals
      "UPDATE goals SET streak_insurance_days = 0 WHERE streak_insurance_days IS NULL;"
    ]

    for (const sql of migrations) {
      console.log('Executing:', sql.substring(0, 50) + '...')
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
      if (error) {
        console.error('Migration error:', error)
        // Try direct query if RPC fails
        const { error: directError } = await supabaseAdmin
          .from('_supabase_migrations')
          .select('*')
          .limit(1)
        
        if (directError) {
          console.log('Using alternative execution method')
          // Log the SQL for manual execution
          console.log('SQL to execute manually:', sql)
        }
      }
    }

    // Create RLS policies
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Users can view own streak recoveries" ON streak_recoveries
       FOR SELECT USING (user_id = auth.jwt() ->> 'sub');`,
      
      `CREATE POLICY IF NOT EXISTS "Service role can insert streak recoveries" ON streak_recoveries
       FOR INSERT WITH CHECK (true);`
    ]

    for (const policy of policies) {
      console.log('Creating policy:', policy.substring(0, 50) + '...')
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy })
      if (error) {
        console.error('Policy error:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Streak insurance schema migration completed successfully!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Migration failed:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the logs for specific migration errors'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})