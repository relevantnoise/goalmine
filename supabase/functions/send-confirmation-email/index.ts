import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ConfirmationEmail } from './_templates/confirmation-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    console.log('Received webhook payload:', payload);

    // Parse the payload directly (Supabase auth hooks don't use webhook signatures)
    let webhookData;
    try {
      webhookData = JSON.parse(payload);
    } catch (parseError) {
      console.error('Failed to parse payload:', parseError);
      throw new Error('Invalid JSON payload');
    }

    console.log('Parsed webhook data:', JSON.stringify(webhookData));
    
    // Handle different webhook data structures
    const user = webhookData.record || webhookData.user || webhookData;
    
    if (!user || !user.email) {
      console.error('No user email found in webhook data');
      throw new Error('User email not found in webhook payload');
    }

    // Create email data with fallbacks
    const email_data = webhookData.email_data || {
      token: webhookData.token || 'no-token',
      token_hash: webhookData.token_hash || 'no-hash', 
      redirect_to: webhookData.redirect_to || 'https://d29859bd-6b5c-4f96-8c57-38eeb3739c83.lovableproject.com/',
      email_action_type: webhookData.type || webhookData.event_type || 'signup'
    };
    
    // Replace localhost URLs with Lovable preview URL to avoid connection issues
    if (email_data.redirect_to.includes('localhost')) {
      email_data.redirect_to = 'https://d29859bd-6b5c-4f96-8c57-38eeb3739c83.lovableproject.com/';
    }

    console.log('Email data redirect_to:', email_data.redirect_to);
    console.log('Email data token_hash:', email_data.token_hash);

    console.log(`Sending confirmation email to ${user.email} for action: ${email_data.email_action_type}`);

    // Only handle signup confirmations  
    if (email_data.email_action_type === 'signup' || !email_data.email_action_type) {
      console.log('Processing signup confirmation request');
      console.log('User email:', user.email);
      
      try {
        // Render the confirmation email
        const html = await renderAsync(
          React.createElement(ConfirmationEmail, {
            confirmationUrl: `https://dhlcycjnzwfnadmsptof.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`,
            token: email_data.token,
            userEmail: user.email
          })
        );

        // Send the email via Resend
        const emailResponse = await resend.emails.send({
          from: "GoalMine.ai Team <onboarding@resend.dev>",
          to: [user.email],
          reply_to: "support@goalmine.ai",
          subject: "Welcome to GoalMine.ai - Please confirm your email",
          html: html,
        });

        console.log('Confirmation email sent successfully:', emailResponse);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        throw emailError;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);