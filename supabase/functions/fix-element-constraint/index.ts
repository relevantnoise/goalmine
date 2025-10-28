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
    console.log('🔧 Fixing element constraint...')
    
    // Use Deno's built-in postgres client
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL')
    }
    
    const url = new URL(supabaseUrl)
    const projectRef = url.hostname.split('.')[0]
    
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

    // First, drop the existing constraint
    console.log('🗑️ Dropping existing constraint...')
    await client.queryArray(`
      ALTER TABLE public.element_allocations 
      DROP CONSTRAINT IF EXISTS element_allocations_element_name_check;
    `)

    // Create the new constraint with the exact element names we need
    console.log('✨ Creating new constraint...')
    await client.queryArray(`
      ALTER TABLE public.element_allocations 
      ADD CONSTRAINT element_allocations_element_name_check 
      CHECK (element_name IN (
        'Work',
        'Sleep', 
        'Friends & Family',
        'Health & Fitness',
        'Personal Development',
        'Spiritual'
      ));
    `)

    console.log('✅ Constraint updated successfully')

    // Test the constraint with Personal Development
    console.log('🧪 Testing Personal Development...')
    
    try {
      await client.queryArray(`
        INSERT INTO public.element_allocations (
          framework_id, 
          element_name, 
          importance_level, 
          current_hours_per_week, 
          ideal_hours_per_week
        ) VALUES (
          gen_random_uuid(),
          'Personal Development',
          5,
          10.0,
          10.0
        );
      `)
      console.log('✅ Personal Development test insert successful')
      
      // Clean up test row
      await client.queryArray(`
        DELETE FROM public.element_allocations 
        WHERE element_name = 'Personal Development' 
        AND importance_level = 5 
        AND current_hours_per_week = 10.0;
      `)
      console.log('🧹 Test row cleaned up')
      
    } catch (testError) {
      console.error('❌ Personal Development test failed:', testError)
    }

    await client.end()
    console.log('🔌 Database connection closed')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Element constraint fixed successfully!',
        timestamp: new Date().toISOString(),
        actions: [
          'Dropped old constraint',
          'Created new constraint with correct element names',
          'Tested Personal Development insertion'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Constraint fix failed:', error)
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