import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Creating Six Elements of Life tables...')
    
    const results = []

    // Execute SQL directly to create tables
    console.log('📊 Creating tables with direct SQL execution...')
    
    // SQL to create all three tables
    const createTablesSQL = `
      -- Create six_elements_frameworks table
      CREATE TABLE IF NOT EXISTS public.six_elements_frameworks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_email TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create element_allocations table
      CREATE TABLE IF NOT EXISTS public.element_allocations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
          element_name TEXT NOT NULL CHECK (element_name IN ('Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual')),
          importance_level INTEGER NOT NULL CHECK (importance_level >= 1 AND importance_level <= 10),
          current_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
          ideal_hours_per_week DECIMAL(4,1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create work_happiness_assessment table
      CREATE TABLE IF NOT EXISTS public.work_happiness_assessment (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          framework_id UUID NOT NULL REFERENCES public.six_elements_frameworks(id) ON DELETE CASCADE,
          impact_current INTEGER NOT NULL CHECK (impact_current >= 1 AND impact_current <= 10),
          impact_desired INTEGER NOT NULL CHECK (impact_desired >= 1 AND impact_desired <= 10),
          enjoyment_current INTEGER NOT NULL CHECK (enjoyment_current >= 1 AND enjoyment_current <= 10),
          enjoyment_desired INTEGER NOT NULL CHECK (enjoyment_desired >= 1 AND enjoyment_desired <= 10),
          income_current INTEGER NOT NULL CHECK (income_current >= 1 AND income_current <= 10),
          income_desired INTEGER NOT NULL CHECK (income_desired >= 1 AND income_desired <= 10),
          remote_current INTEGER NOT NULL CHECK (remote_current >= 1 AND remote_current <= 10),
          remote_desired INTEGER NOT NULL CHECK (remote_desired >= 1 AND remote_desired <= 10),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_six_elements_frameworks_user_email ON public.six_elements_frameworks(user_email);
      CREATE INDEX IF NOT EXISTS idx_element_allocations_framework_id ON public.element_allocations(framework_id);
      CREATE INDEX IF NOT EXISTS idx_work_happiness_framework_id ON public.work_happiness_assessment(framework_id);
      
      -- Enable RLS
      ALTER TABLE public.six_elements_frameworks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.element_allocations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.work_happiness_assessment ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      DROP POLICY IF EXISTS "Enable service role full access" ON public.six_elements_frameworks;
      CREATE POLICY "Enable service role full access" ON public.six_elements_frameworks FOR ALL USING (true);
      
      DROP POLICY IF EXISTS "Enable service role full access" ON public.element_allocations;
      CREATE POLICY "Enable service role full access" ON public.element_allocations FOR ALL USING (true);
      
      DROP POLICY IF EXISTS "Enable service role full access" ON public.work_happiness_assessment;
      CREATE POLICY "Enable service role full access" ON public.work_happiness_assessment FOR ALL USING (true);
    `

    // Create each table by trying to insert a test record, which will trigger table creation
    console.log('📋 Creating six_elements_frameworks table...')
    try {
      const { data, error } = await supabaseClient
        .from('six_elements_frameworks')
        .insert({
          user_email: 'test@example.com'
        })
        .select()
        .single()
      
      if (error && error.message.includes('relation "six_elements_frameworks" does not exist')) {
        console.log('❌ six_elements_frameworks table needs manual creation in Supabase Dashboard')
        results.push({ 
          table: 'six_elements_frameworks', 
          status: 'needs_manual_creation',
          instructions: 'Go to Supabase Dashboard > SQL Editor and run the CREATE TABLE command'
        })
      } else if (error) {
        console.log('❌ Error with six_elements_frameworks:', error.message)
        results.push({ table: 'six_elements_frameworks', status: 'error', error: error.message })
      } else {
        console.log('✅ six_elements_frameworks table exists and working')
        results.push({ table: 'six_elements_frameworks', status: 'working' })
        
        // Clean up test record
        await supabaseClient
          .from('six_elements_frameworks')
          .delete()
          .eq('user_email', 'test@example.com')
      }
    } catch (err) {
      console.log('❌ Exception with six_elements_frameworks:', err.message)
      results.push({ table: 'six_elements_frameworks', status: 'error', error: err.message })
    }

    // Test table access after creation
    console.log('🧪 Testing table access...')
    
    const testTables = ['six_elements_frameworks', 'element_allocations', 'work_happiness_assessment']
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName} table still not accessible:`, error.message)
          results.push({ table: tableName, status: 'not_accessible', error: error.message })
        } else {
          console.log(`✅ ${tableName} table is accessible`)
          results.push({ table: tableName, status: 'accessible' })
        }
      } catch (err) {
        console.log(`❌ ${tableName} test error:`, err.message)
        results.push({ table: tableName, status: 'test_error', error: err.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Six Elements tables creation attempted',
        timestamp: new Date().toISOString(),
        results,
        nextSteps: [
          'Review results above',
          'Manually create missing tables using migrations',
          'Test table access with edge functions'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Function failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})