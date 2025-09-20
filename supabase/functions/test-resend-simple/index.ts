import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TEST-RESEND] Testing Resend email delivery');
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('[TEST-RESEND] API key exists:', !!resendApiKey);
    console.log('[TEST-RESEND] API key prefix:', resendApiKey?.substring(0, 10) + '...');
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY environment variable not set' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    
    const { testEmail } = await req.json();
    const emailAddress = testEmail || 'dandlynn@yahoo.com';

    console.log(`[TEST-RESEND] Sending test email to: ${emailAddress}`);

    const result = await resend.emails.send({
      from: "GoalMine.ai Test <onboarding@resend.dev>",
      to: [emailAddress],
      subject: "GoalMine.ai Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6c47ff;">🧪 Email System Test</h1>
          <p>This is a test email from GoalMine.ai to verify the email system is working.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Recipient:</strong> ${emailAddress}</p>
        </div>
      `
    });

    console.log('[TEST-RESEND] Resend response:', result);

    if (result.error) {
      console.error('[TEST-RESEND] Resend error:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result.error,
          message: 'Resend API error'
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('[TEST-RESEND] Email sent successfully:', result.data?.id);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: result.data?.id,
        message: `Test email sent successfully to ${emailAddress}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-RESEND] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack,
        message: 'Test email failed'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);