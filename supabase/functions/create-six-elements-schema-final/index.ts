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
    console.log('🚀 Creating Six Elements tables using direct SQL execution...')
    
    // Use the Supabase connection info to execute SQL directly
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Extract database connection details from Supabase URL
    const url = new URL(supabaseUrl)
    const projectRef = url.hostname.split('.')[0]
    
    console.log('📊 Connecting to database...')
    
    // Use Deno's built-in postgres client
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    
    const client = new Client({
      user: `postgres.${projectRef}`,
      database: "postgres",
      hostname: `aws-0-us-west-1.pooler.supabase.com`,
      password: Deno.env.get('DB_PASSWORD') || 'goalmine2024!',
      port: 6543,
      tls: {
        enabled: true,
        enforce: false,
        caCertificates: []
      }
    })

    await client.connect()
    console.log('✅ Connected to database')

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

    console.log('📋 Executing table creation SQL...')
    await client.queryArray(createTablesSQL)
    console.log('✅ All tables created successfully')

    // Test table access
    console.log('🧪 Testing table access...')
    const testResults = []
    
    const tables = ['six_elements_frameworks', 'element_allocations', 'work_happiness_assessment']
    for (const table of tables) {
      try {
        const result = await client.queryArray(`SELECT COUNT(*) FROM public.${table}`)
        console.log(`✅ ${table}: ${result.rows[0][0]} rows`)
        testResults.push({ table, status: 'accessible', rows: result.rows[0][0] })
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
        testResults.push({ table, status: 'error', error: err.message })
      }
    }

    await client.end()
    console.log('🔌 Database connection closed')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Six Elements of Life tables created successfully!',
        timestamp: new Date().toISOString(),
        tablesCreated: [
          'six_elements_frameworks',
          'element_allocations', 
          'work_happiness_assessment'
        ],
        testResults,
        ready: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Table creation failed:', error)
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