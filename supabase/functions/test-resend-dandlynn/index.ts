import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TEST-RESEND-DANDLYNN] Testing Resend status for dandlynn@yahoo.com');
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not found');
    }

    // Test 1: Try to send a test email to dandlynn@yahoo.com
    console.log('[TEST-RESEND-DANDLYNN] Attempting to send test email...');
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GoalMine.ai <onboarding@resend.dev>',
        to: ['dandlynn@yahoo.com'],
        subject: 'Test Email - GoalMine.ai Debug',
        html: '<p>This is a test email to verify Resend delivery to dandlynn@yahoo.com</p><p>If you receive this, Resend is working correctly.</p>'
      })
    });

    const emailResult = await emailResponse.json();
    console.log('[TEST-RESEND-DANDLYNN] Email send result:', emailResult);

    // Test 2: Check account status
    console.log('[TEST-RESEND-DANDLYNN] Checking account status...');
    
    const accountResponse = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`
      }
    });

    const accountResult = await accountResponse.json();
    console.log('[TEST-RESEND-DANDLYNN] Account status:', accountResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        emailSent: emailResponse.ok,
        emailResult,
        accountStatus: accountResult,
        message: emailResponse.ok ? 
          'Test email sent successfully to dandlynn@yahoo.com' : 
          'Failed to send test email - check Resend verification'
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-RESEND-DANDLYNN] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to test Resend - check API key and configuration'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);