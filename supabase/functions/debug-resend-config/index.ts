import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY")
    console.log('Resend API Key exists:', !!apiKey)
    console.log('Resend API Key prefix:', apiKey?.substring(0, 10) + '...')

    const resend = new Resend(apiKey);

    // Test 1: Working email (danlynn@gmail.com)
    console.log('Testing danlynn@gmail.com...')
    const workingEmailResult = await resend.emails.send({
      from: "GoalMine.ai <onboarding@resend.dev>",
      to: ["danlynn@gmail.com"],
      subject: "Test Email - danlynn@gmail.com (Working)",
      html: `<p>Test email to verify Resend is working - ${new Date().toISOString()}</p>`
    })

    console.log('Working email result:', workingEmailResult)

    // Test 2: Failing email (dandlynn@yahoo.com)
    console.log('Testing dandlynn@yahoo.com...')
    const failingEmailResult = await resend.emails.send({
      from: "GoalMine.ai <onboarding@resend.dev>",
      to: ["dandlynn@yahoo.com"],
      subject: "Test Email - dandlynn@yahoo.com (Failing)",
      html: `<p>Test email to verify Resend issue - ${new Date().toISOString()}</p>`
    })

    console.log('Failing email result:', failingEmailResult)

    return new Response(
      JSON.stringify({
        api_key_configured: !!apiKey,
        api_key_prefix: apiKey?.substring(0, 10) + '...',
        working_email: {
          success: !workingEmailResult.error,
          result: workingEmailResult,
          email_id: workingEmailResult.data?.id
        },
        failing_email: {
          success: !failingEmailResult.error,
          result: failingEmailResult,
          email_id: failingEmailResult.data?.id
        },
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Resend config test error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        error_details: error,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})