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

    console.log('🧪 Testing Six Elements tables access...')
    
    const results = []

    // Test each table
    const tables = ['six_elements_frameworks', 'element_allocations', 'work_happiness_assessment']
    
    for (const tableName of tables) {
      try {
        console.log(`📋 Testing ${tableName}...`)
        
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
          results.push({ 
            table: tableName, 
            status: 'error', 
            error: error.message 
          })
        } else {
          console.log(`✅ ${tableName}: accessible (${data.length} rows)`)
          results.push({ 
            table: tableName, 
            status: 'accessible', 
            rowCount: data.length 
          })
        }
      } catch (err) {
        console.log(`💥 ${tableName}: exception - ${err.message}`)
        results.push({ 
          table: tableName, 
          status: 'exception', 
          error: err.message 
        })
      }
    }

    // Test goals table for element_type column
    try {
      console.log('📋 Testing goals.element_type column...')
      const { data, error } = await supabaseClient
        .from('goals')
        .select('element_type')
        .limit(1)
      
      if (error && error.message.includes('column "element_type" does not exist')) {
        console.log('❌ element_type column missing from goals table')
        results.push({ 
          table: 'goals', 
          column: 'element_type',
          status: 'column_missing' 
        })
      } else if (error) {
        console.log('❌ goals table error:', error.message)
        results.push({ 
          table: 'goals', 
          column: 'element_type',
          status: 'error', 
          error: error.message 
        })
      } else {
        console.log('✅ goals.element_type column exists')
        results.push({ 
          table: 'goals', 
          column: 'element_type',
          status: 'exists' 
        })
      }
    } catch (err) {
      console.log('💥 goals table exception:', err.message)
      results.push({ 
        table: 'goals', 
        column: 'element_type',
        status: 'exception', 
        error: err.message 
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Six Elements tables test completed',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          accessible: results.filter(r => r.status === 'accessible').length,
          errors: results.filter(r => r.status === 'error').length,
          missing: results.filter(r => r.status === 'column_missing').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Test function failed:', error)
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