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

    console.log('🧪 Testing each element name individually...')
    
    // Create a test framework first
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .insert({
        user_email: 'element-test@example.com'
      })
      .select()
      .single()

    if (frameworkError) {
      throw new Error(`Framework creation failed: ${frameworkError.message}`)
    }

    console.log('✅ Test framework created:', framework.id)

    // Test each element name one by one
    const elementNames = [
      'Work',
      'Sleep', 
      'Friends & Family',
      'Health & Fitness',
      'Personal Development',
      'Spiritual'
    ]
    
    const results = []

    for (const elementName of elementNames) {
      try {
        console.log(`🔍 Testing: "${elementName}"`)
        
        const { data: element, error: elementError } = await supabaseClient
          .from('element_allocations')
          .insert({
            framework_id: framework.id,
            element_name: elementName,
            importance_level: 5,
            current_hours_per_week: 10.0,
            ideal_hours_per_week: 10.0
          })
          .select()
          .single()

        if (elementError) {
          console.error(`❌ "${elementName}" failed:`, elementError.message)
          results.push({
            element: elementName,
            status: 'failed',
            error: elementError.message,
            code: elementError.code,
            details: elementError.details
          })
        } else {
          console.log(`✅ "${elementName}" success:`, element.id)
          results.push({
            element: elementName,
            status: 'success',
            id: element.id
          })
        }
      } catch (err) {
        console.error(`💥 "${elementName}" exception:`, err)
        results.push({
          element: elementName,
          status: 'exception',
          error: err.message
        })
      }
    }

    // Clean up - delete the test framework
    await supabaseClient
      .from('six_elements_frameworks')
      .delete()
      .eq('id', framework.id)

    console.log('🧹 Test framework cleaned up')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Individual element testing completed',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          total: elementNames.length,
          passed: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length,
          exceptions: results.filter(r => r.status === 'exception').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Individual element test failed:', error)
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