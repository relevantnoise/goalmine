import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Testing emails to both users with identical content')

    const testContent = {
      goal: 'Test Goal',
      message: 'Test message to compare email delivery',
      microPlan: 'Test step 1\nTest step 2\nTest step 3',
      challenge: 'Test challenge',
      streak: 1,
      redirectUrl: 'https://goalmine.ai',
      isNudge: false,
      userId: 'test-user',
      goalId: 'test-goal'
    }

    // Test danlynn@gmail.com (working user)
    console.log('Testing danlynn@gmail.com...')
    const danlynn_response = await supabaseClient.functions.invoke('send-motivation-email', {
      body: {
        ...testContent,
        email: 'danlynn@gmail.com',
        name: 'danlynn'
      }
    });

    // Test dandlynn@yahoo.com (failing user)
    console.log('Testing dandlynn@yahoo.com...')
    const dandlynn_response = await supabaseClient.functions.invoke('send-motivation-email', {
      body: {
        ...testContent,
        email: 'dandlynn@yahoo.com',
        name: 'dandlynn'
      }
    });

    return new Response(
      JSON.stringify({
        test_content: testContent,
        danlynn_gmail: {
          success: !danlynn_response.error,
          error: danlynn_response.error,
          data: danlynn_response.data
        },
        dandlynn_yahoo: {
          success: !dandlynn_response.error,
          error: dandlynn_response.error,
          data: dandlynn_response.data
        },
        comparison: {
          both_successful: !danlynn_response.error && !dandlynn_response.error,
          same_error: JSON.stringify(danlynn_response.error) === JSON.stringify(dandlynn_response.error)
        },
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
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