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

    console.log('Testing direct email to dandlynn@yahoo.com')

    // Test sending email directly
    const emailResponse = await supabaseClient.functions.invoke('send-motivation-email', {
      body: {
        email: 'dandlynn@yahoo.com',
        name: 'dandlynn',
        goal: 'Start a new ai-application studio company.',
        message: 'Test message for dandlynn@yahoo.com - this is a direct test to verify email delivery works.',
        microPlan: 'Test micro-plan item 1\nTest micro-plan item 2\nTest micro-plan item 3',
        challenge: 'Test challenge: Can you receive this email successfully?',
        streak: 3,
        redirectUrl: 'https://goalmine.ai',
        isNudge: false,
        userId: 's7LOUJx5zSSWWP2ogg7r6sqHSqF3',
        goalId: '5e854f82-ba9f-46b8-b327-b70c91b97a80'
      }
    });

    console.log('Email response:', emailResponse)

    return new Response(
      JSON.stringify({
        test: 'Direct email to dandlynn@yahoo.com',
        email_response: emailResponse,
        success: !emailResponse.error,
        error: emailResponse.error || null,
        data: emailResponse.data || null,
        timestamp: new Date().toISOString()
      }),
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