import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Testing direct Resend API call to dandlynn@yahoo.com')

    const simpleEmail = {
      from: "GoalMine.ai <onboarding@resend.dev>",
      to: ["dandlynn@yahoo.com"],
      subject: "Simple Test Email - dandlynn@yahoo.com",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Simple Test Email</h1>
          <p>This is a basic test to see if Resend can deliver to dandlynn@yahoo.com</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    }

    console.log('Sending email with data:', JSON.stringify(simpleEmail, null, 2))

    const result = await resend.emails.send(simpleEmail)

    console.log('Resend result:', result)

    if (result.error) {
      throw new Error(result.error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        resend_result: result,
        email_id: result.data?.id,
        email_data: simpleEmail,
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Direct Resend test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
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