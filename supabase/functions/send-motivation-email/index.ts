import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client for delivery tracking
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MotivationEmailRequest {
  email: string;
  name: string;
  goal: string;
  message: string;
  microPlan: string;
  challenge: string;
  streak: number;
  redirectUrl?: string;
  isNudge?: boolean;
  userId?: string;
  goalId?: string;
  scheduledAt?: string;
}

// Log email delivery attempt
const logEmailDelivery = async (
  userId: string | null,
  goalId: string | null,
  emailType: string,
  recipientEmail: string,
  subject: string,
  status: 'pending' | 'sent' | 'failed',
  externalId?: string,
  errorMessage?: string
) => {
  try {
    await supabase.from('email_deliveries').insert({
      user_id: userId,
      goal_id: goalId,
      email_type: emailType,
      recipient_email: recipientEmail,
      subject: subject,
      status: status,
      external_id: externalId,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error('Failed to log email delivery:', error);
  }
};

// Send email with retry logic
const sendEmailWithRetry = async (
  emailData: any,
  userId: string | null = null,
  goalId: string | null = null,
  emailType: string = 'motivation',
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string }> => {
  
  // Log initial attempt
  await logEmailDelivery(
    userId,
    goalId,
    emailType,
    emailData.to[0],
    emailData.subject,
    'pending'
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} for ${emailData.to[0]}`);
      
      const result = await resend.emails.send(emailData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Log successful delivery
      await logEmailDelivery(
        userId,
        goalId,
        emailType,
        emailData.to[0],
        emailData.subject,
        'sent',
        result.data?.id
      );
      
      console.log(`✅ Email sent successfully on attempt ${attempt}:`, result.data?.id);
      return { success: true, data: result.data };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Email attempt ${attempt}/${maxRetries} failed:`, errorMessage);
      
      // If this is the final attempt, log the failure
      if (attempt === maxRetries) {
        await logEmailDelivery(
          userId,
          goalId,
          emailType,
          emailData.to[0],
          emailData.subject,
          'failed',
          undefined,
          errorMessage
        );
        
        return { success: false, error: errorMessage };
      }
      
      // Exponential backoff: wait before retrying
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, goal, message, microPlan, challenge, streak, redirectUrl, isNudge, userId, goalId, scheduledAt }: MotivationEmailRequest = await req.json();

    console.log('Sending motivation email to:', email, isNudge ? '(NUDGE)' : '(REGULAR)');

    // Different email templates for nudges vs regular motivation
    const emailSubject = isNudge 
      ? `🔔 NUDGE: ${goal} - Day ${streak}` 
      : `Day ${streak} - Keep pushing towards: ${goal}`;
    
    const emailType = isNudge ? 'nudge' : 'daily_motivation';

    const emailHTML = isNudge ? 
      // Short, punchy nudge email
      `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 15px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background: #ff6b35; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
              🔔 NUDGE
            </div>
            <h1 style="color: #6c47ff; font-size: 24px; margin: 10px 0;">GoalMine.ai</h1>
          </div>
          
          <div style="background: #fff; border: 3px solid #ff6b35; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <h2 style="color: #ff6b35; font-size: 18px; margin-bottom: 10px;">⚡ Quick Reminder!</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px; font-weight: bold;">${goal}</p>
            <p style="color: #555; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">${message}</p>
            <div style="background: #fff3e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
              <p style="color: #f57f17; font-size: 14px; font-weight: bold; margin: 0;">💡 Quick Action: ${challenge}</p>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${redirectUrl || 'https://goalmine.ai'}/?checkin=true&user=${encodeURIComponent(email)}&goal=${encodeURIComponent(goalId || '')}&t=${Date.now()}" 
               style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">
              ⚡ QUICK CHECK-IN
            </a>
          </div>

          <div style="text-align: center; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 11px;">
              Day ${streak} • GoalMine.ai Nudge
            </p>
          </div>
        </div>
      `
      :
      // Full regular motivation email
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6c47ff; font-size: 32px; margin-bottom: 10px;">🎯 GoalMine.ai</h1>
            <p style="color: #666; font-size: 16px;">Your daily motivation boost is here!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">Day ${streak} Progress</h2>
            <p style="color: #555; font-size: 18px; line-height: 1.6; margin-bottom: 0;"><strong>Goal:</strong> ${goal}</p>
          </div>

          <div style="background: #fff; border: 2px solid #6c47ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #6c47ff; font-size: 20px; margin-bottom: 15px;">✨ Today's Motivation</h3>
            <p style="color: #333; font-size: 16px; line-height: 1.7; white-space: pre-line;">${message}</p>
          </div>

          <div style="background: #e8f5e8; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #2d7d32; font-size: 18px; margin-bottom: 15px;">🎯 Today's Micro-Plan</h3>
            <div style="color: #333; font-size: 16px; line-height: 1.7;">
              ${typeof microPlan === 'string' ? 
                microPlan.split('\n').map(item => item.trim()).filter(item => item).map(item => 
                  `<div style="margin-bottom: 8px;">• ${item.replace(/^•\s*/, '')}</div>`
                ).join('') : 
                Array.isArray(microPlan) ? 
                  microPlan.map(item => `<div style="margin-bottom: 8px;">• ${item}</div>`).join('') :
                  `<p>${microPlan}</p>`
              }
            </div>
          </div>

          <div style="background: #fff3e0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #f57f17; font-size: 18px; margin-bottom: 15px;">💪 Today's Challenge</h3>
            <p style="color: #333; font-size: 16px; line-height: 1.7; white-space: pre-line;">${challenge}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #d97706; font-size: 18px; margin-bottom: 10px;">🔥 Your ${streak}-Day Streak is Waiting!</h3>
              <p style="color: #92400e; font-size: 16px; margin-bottom: 15px;">
                Don't break your momentum! Check in today to keep your streak alive and growing.
              </p>
            </div>
            <a href="${redirectUrl || 'https://goalmine.ai'}/?checkin=true&user=${encodeURIComponent(email)}&goal=${encodeURIComponent(goalId || '')}&t=${Date.now()}" 
               style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
              ✅ CHECK IN NOW - Update Your Streak!
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">
              Missing today breaks your streak! Don't let your progress reset to zero.
            </p>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              GoalMine.ai - Your personal goal achievement companion<br>
              <a href="#" style="color: #999;">Unsubscribe</a> | <a href="#" style="color: #999;">Update preferences</a>
            </p>
          </div>
        </div>
      `;

    // Use retry logic for email sending
    const emailData: any = {
      from: "GoalMine.ai <noreply@notifications.goalmine.ai>",
      to: [email],
      subject: emailSubject,
      html: emailHTML,
    };
    
    // Add scheduling if provided
    if (scheduledAt) {
      emailData.scheduledAt = scheduledAt;
      console.log('Scheduling email for:', scheduledAt);
    }
    
    const emailResponse = await sendEmailWithRetry(
      emailData,
      userId || null,
      goalId || null,
      emailType
    );

    if (emailResponse.success) {
      console.log("Email sent successfully:", emailResponse.data?.id);
      return new Response(JSON.stringify({ 
        success: true, 
        id: emailResponse.data?.id,
        message: 'Email sent successfully'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      console.error("Email sending failed after retries:", emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResponse.error,
        message: 'Email delivery failed after multiple attempts'
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  } catch (error: any) {
    console.error("Error in send-motivation-email function:", error);
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