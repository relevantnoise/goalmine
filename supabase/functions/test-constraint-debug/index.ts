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

    console.log('🧪 Testing element name constraints...')
    
    // Test each element name individually
    const elementNames = ['Work', 'Sleep', 'Friends & Family', 'Health & Fitness', 'Personal Development', 'Spiritual']
    const results = []

    // First create a test framework
    const { data: framework, error: frameworkError } = await supabaseClient
      .from('six_elements_frameworks')
      .insert({
        user_email: 'constraint-test@example.com'
      })
      .select()
      .single()

    if (frameworkError) {
      throw new Error(`Framework creation failed: ${frameworkError.message}`)
    }

    console.log('✅ Test framework created:', framework.id)

    // Test each element name
    for (const elementName of elementNames) {
      try {
        console.log(`🔍 Testing element: "${elementName}"`)
        console.log(`📏 Element length: ${elementName.length}`)
        console.log(`🔤 Element chars:`, elementName.split('').map(c => `"${c}"`).join(', '))
        
        const { data: element, error: elementError } = await supabaseClient
          .from('element_allocations')
          .insert({
            framework_id: framework.id,
            element_name: elementName,
            importance_level: 5,
            current_hours_per_week: 10,
            ideal_hours_per_week: 10
          })
          .select()
          .single()

        if (elementError) {
          console.error(`❌ Failed "${elementName}":`, elementError)
          results.push({ 
            element: elementName, 
            status: 'failed', 
            error: elementError.message,
            length: elementName.length,
            chars: elementName.split('')
          })
        } else {
          console.log(`✅ Success "${elementName}":`, element.id)
          results.push({ 
            element: elementName, 
            status: 'success', 
            id: element.id 
          })
        }
      } catch (err) {
        console.error(`💥 Exception "${elementName}":`, err)
        results.push({ 
          element: elementName, 
          status: 'exception', 
          error: err.message 
        })
      }
    }

    // Clean up test framework
    await supabaseClient
      .from('six_elements_frameworks')
      .delete()
      .eq('id', framework.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Constraint testing completed',
        timestamp: new Date().toISOString(),
        results,
        summary: {
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
    console.error('❌ Constraint test failed:', error)
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