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
    console.log('🔧 Fixing circle_type constraint...')
    
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

    // Drop the old constraint
    console.log('🗑️ Dropping old constraint...')
    await client.queryArray(`
      ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_circle_type_check;
    `)

    // Add new constraint with correct 6 Elements names
    console.log('✨ Creating new constraint...')
    await client.queryArray(`
      ALTER TABLE goals ADD CONSTRAINT goals_circle_type_check 
      CHECK (circle_type IN (
        'Work',
        'Sleep', 
        'Friends & Family',
        'Health & Fitness',
        'Personal Development',
        'Spiritual'
      ));
    `)

    console.log('✅ Constraint updated successfully')

    await client.end()
    console.log('🔌 Database connection closed')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Circle type constraint fixed successfully!',
        timestamp: new Date().toISOString(),
        allowedValues: [
          'Work',
          'Sleep', 
          'Friends & Family',
          'Health & Fitness',
          'Personal Development',
          'Spiritual'
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