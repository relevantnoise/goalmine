import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🏗️ Executing 6 Elements Framework SQL...')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute SQL commands one by one using direct queries
    const commands = [
      {
        name: 'user_frameworks table',
        sql: `CREATE TABLE IF NOT EXISTS user_frameworks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          onboarding_completed BOOLEAN DEFAULT false,
          last_checkin_date DATE,
          total_checkins INTEGER DEFAULT 0
        )`
      },
      {
        name: 'user_frameworks indexes',
        sql: `CREATE INDEX IF NOT EXISTS idx_user_frameworks_user_id ON user_frameworks(user_id)`
      },
      {
        name: 'framework_elements table',
        sql: `CREATE TABLE IF NOT EXISTS framework_elements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL,
          element_name TEXT NOT NULL,
          current_state INTEGER,
          desired_state INTEGER,
          personal_definition TEXT,
          weekly_hours INTEGER DEFAULT 0,
          priority_level INTEGER DEFAULT 3,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'work_happiness table',
        sql: `CREATE TABLE IF NOT EXISTS work_happiness (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL,
          impact_current INTEGER,
          impact_desired INTEGER,
          fun_current INTEGER,
          fun_desired INTEGER,
          money_current INTEGER,
          money_desired INTEGER,
          remote_current INTEGER,
          remote_desired INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'weekly_checkins table',
        sql: `CREATE TABLE IF NOT EXISTS weekly_checkins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL,
          week_ending DATE NOT NULL,
          element_scores JSONB NOT NULL DEFAULT '{}',
          overall_satisfaction INTEGER,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        name: 'ai_insights table',
        sql: `CREATE TABLE IF NOT EXISTS ai_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL,
          insight_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          priority INTEGER DEFAULT 1,
          is_read BOOLEAN DEFAULT false,
          expires_at TIMESTAMP WITH TIME ZONE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      }
    ]

    const results = []
    let successCount = 0

    for (const command of commands) {
      try {
        console.log(`📋 Creating ${command.name}...`)
        
        // Use raw SQL execution
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: command.sql
        })
        
        if (error) {
          console.error(`❌ Error with ${command.name}:`, error)
          results.push({
            name: command.name,
            success: false,
            error: error.message
          })
        } else {
          console.log(`✅ ${command.name} created successfully`)
          results.push({
            name: command.name,
            success: true
          })
          successCount++
        }
      } catch (cmdError) {
        console.error(`❌ Exception with ${command.name}:`, cmdError)
        results.push({
          name: command.name,
          success: false,
          error: cmdError.message
        })
      }
    }

    const summary = {
      success: successCount === commands.length,
      message: `Framework tables creation: ${successCount}/${commands.length} successful`,
      results,
      successCount,
      totalCommands: commands.length,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Framework SQL execution complete:', summary)

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('🚨 Fatal error executing framework SQL:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Failed to execute framework SQL commands',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})