// Simple script to set up database tables via Supabase REST API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co'
const serviceKey = 'sbp_397a106a136068d33edf70eaf6e579cf9eb37d31'

const supabase = createClient(supabaseUrl, serviceKey)

async function setupDatabase() {
  console.log('🔧 Setting up simplified circle framework database...')

  // Execute SQL commands one by one
  const queries = [
    // 1. Create user_circle_frameworks table
    `
    CREATE TABLE IF NOT EXISTS user_circle_frameworks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT NOT NULL,
      work_hours_per_week INTEGER NOT NULL DEFAULT 40,
      sleep_hours_per_night DECIMAL(3,1) NOT NULL DEFAULT 8.0,
      commute_hours_per_week INTEGER NOT NULL DEFAULT 5,
      available_hours_per_week INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // 2. Create circle_time_allocations table
    `
    CREATE TABLE IF NOT EXISTS circle_time_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
      circle_name TEXT NOT NULL CHECK (circle_name IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness')),
      importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10) DEFAULT 5,
      current_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
      ideal_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 5,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // 3. Create work_happiness_metrics table
    `
    CREATE TABLE IF NOT EXISTS work_happiness_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
      impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10) DEFAULT 5,
      impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10) DEFAULT 8,
      fun_current INTEGER NOT NULL CHECK (fun_current >= 1 AND fun_current <= 10) DEFAULT 5,
      fun_desired INTEGER NOT NULL CHECK (fun_desired >= 1 AND fun_desired <= 10) DEFAULT 8,
      money_current INTEGER NOT NULL CHECK (money_current >= 1 AND money_current <= 10) DEFAULT 5,
      money_desired INTEGER NOT NULL CHECK (money_desired >= 1 AND money_desired <= 10) DEFAULT 8,
      remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10) DEFAULT 5,
      remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10) DEFAULT 8,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    
    // 4. Create circle_checkins table
    `
    CREATE TABLE IF NOT EXISTS circle_checkins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      framework_id UUID NOT NULL REFERENCES user_circle_frameworks(id) ON DELETE CASCADE,
      week_date DATE NOT NULL,
      circle_name TEXT NOT NULL CHECK (circle_name IN ('Spiritual', 'Friends & Family', 'Work', 'Personal Development', 'Health & Fitness')),
      actual_hours_spent DECIMAL(4,1) NOT NULL DEFAULT 0,
      satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `
  ]

  // Execute each query
  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`📝 Executing query ${i + 1}/${queries.length}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: queries[i] })
      
      if (error) {
        console.error(`❌ Error in query ${i + 1}:`, error)
      } else {
        console.log(`✅ Query ${i + 1} completed successfully`)
      }
    } catch (err) {
      console.error(`❌ Exception in query ${i + 1}:`, err)
    }
  }

  console.log('🎯 Database setup complete!')
}

setupDatabase()