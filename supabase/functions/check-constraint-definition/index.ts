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

    console.log('🔍 Checking constraint definition...')
    
    // Query to get the actual constraint definition
    const { data: constraints, error: constraintError } = await supabaseClient
      .rpc('sql', {
        query: `
          SELECT 
              tc.constraint_name,
              cc.check_clause
          FROM information_schema.table_constraints tc
          JOIN information_schema.check_constraints cc 
              ON tc.constraint_name = cc.constraint_name
          WHERE tc.table_name = 'element_allocations' 
              AND tc.constraint_type = 'CHECK'
              AND cc.check_clause LIKE '%element_name%';
        `
      })

    if (constraintError) {
      console.error('❌ Constraint query failed:', constraintError)
    } else {
      console.log('✅ Constraint data:', constraints)
    }

    // Alternative approach - try to get table schema info
    const { data: columns, error: columnError } = await supabaseClient
      .rpc('sql', {
        query: `
          SELECT 
              column_name,
              data_type,
              column_default,
              is_nullable
          FROM information_schema.columns
          WHERE table_name = 'element_allocations'
          ORDER BY ordinal_position;
        `
      })

    if (columnError) {
      console.error('❌ Column query failed:', columnError)
    } else {
      console.log('✅ Column data:', columns)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Constraint check completed',
        timestamp: new Date().toISOString(),
        constraints: constraints || null,
        columns: columns || null,
        constraintError: constraintError?.message || null,
        columnError: columnError?.message || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Constraint check failed:', error)
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