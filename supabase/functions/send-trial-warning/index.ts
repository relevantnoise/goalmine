import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send trial warning emails for users approaching trial expiration
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TRIAL-WARNINGS] Starting trial warning email process');

    // Get users whose trials expire in 7 days, 3 days, or 1 day
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Query for users who need trial warnings and aren't already subscribed
    const { data: usersNeedingWarnings, error: queryError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        trial_expires_at,
        created_at
      `)
      .not('trial_expires_at', 'is', null)
      .gte('trial_expires_at', now.toISOString())
      .lte('trial_expires_at', in7Days.toISOString())
      // Exclude users who are already subscribed
      .not('id', 'in', `(
        SELECT user_id FROM subscribers WHERE subscribed = true
      )`);

    if (queryError) {
      console.error('[TRIAL-WARNINGS] Error querying users:', queryError);
      throw queryError;
    }

    console.log(`[TRIAL-WARNINGS] Found ${usersNeedingWarnings?.length || 0} users needing warnings`);

    let emailsSent = 0;
    let errors = 0;

    for (const user of usersNeedingWarnings || []) {
      try {
        const trialExpiresAt = new Date(user.trial_expires_at);
        const daysRemaining = Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine email type based on days remaining
        let emailType: string;
        let shouldSend = false;

        if (daysRemaining <= 1) {
          emailType = 'trial_warning_1_day';
          shouldSend = true;
        } else if (daysRemaining <= 3) {
          emailType = 'trial_warning_3_days';
          shouldSend = true;
        } else if (daysRemaining <= 7) {
          emailType = 'trial_warning_7_days';
          shouldSend = true;
        }

        if (!shouldSend) continue;

        // Check if we've already sent this warning type to this user
        const { data: existingEmail } = await supabase
          .from('email_deliveries')
          .select('id')
          .eq('user_id', user.id)
          .eq('email_type', emailType)
          .eq('status', 'sent')
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
          .limit(1)
          .maybeSingle();

        if (existingEmail) {
          console.log(`[TRIAL-WARNINGS] Skipping ${emailType} for ${user.email} - already sent`);
          continue;
        }

        // Generate warning email content
        const emailSubject = daysRemaining <= 1 
          ? "⏰ Your GoalMine.ai trial expires tomorrow!"
          : `⏰ ${daysRemaining} days left in your GoalMine.ai trial`;

        const emailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6c47ff; font-size: 32px; margin-bottom: 10px;">🎯 GoalMine.ai</h1>
              <p style="color: #666; font-size: 16px;">Your goal achievement companion</p>
            </div>
            
            <div style="background: ${daysRemaining <= 1 ? '#fee2e2' : '#fef3c7'}; border: 2px solid ${daysRemaining <= 1 ? '#dc2626' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
              <h2 style="color: ${daysRemaining <= 1 ? '#dc2626' : '#d97706'}; font-size: 24px; margin-bottom: 15px;">
                ${daysRemaining <= 1 ? '⏰ Final Day!' : `⏰ ${daysRemaining} Days Remaining`}
              </h2>
              <p style="color: ${daysRemaining <= 1 ? '#7f1d1d' : '#92400e'}; font-size: 16px; margin-bottom: 15px;">
                ${daysRemaining <= 1 
                  ? 'Your free trial ends tomorrow! Don\'t lose access to your goals and progress.'
                  : `Your 30-day free trial expires in ${daysRemaining} days. Upgrade now to keep your momentum going!`
                }
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 20px; margin-bottom: 15px;">✨ What You'll Keep With Premium</h3>
              <ul style="color: #555; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li>Up to 3 simultaneous goals</li>
                <li>Daily AI-powered motivation emails</li>
                <li>Unlimited progress tracking & streak building</li>
                <li>All 4 motivation personality types</li>
                <li>Priority email delivery</li>
                <li>Cancel anytime</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://goalmine.ai/?view=upgrade&utm_source=trial_warning&utm_campaign=${emailType}" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                🚀 Upgrade Now - Just $4.99/month
              </a>
            </div>

            <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
              <p style="color: #0277bd; font-size: 14px; margin: 0;">
                💡 <strong>30-day money-back guarantee</strong> • Cancel anytime • No long-term commitment
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                GoalMine.ai - Your personal goal achievement companion<br>
                Trial expires: ${trialExpiresAt.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        `;

        // Send the email with retry logic (reuse the send function from motivation emails)
        const emailResult = await sendEmailWithRetry({
          from: "GoalMine.ai <noreply@notifications.goalmine.ai>",
          to: [user.email],
          subject: emailSubject,
          html: emailHTML,
        }, user.id, null, emailType);

        if (emailResult.success) {
          console.log(`[TRIAL-WARNINGS] Sent ${emailType} to ${user.email}`);
          emailsSent++;
        } else {
          console.error(`[TRIAL-WARNINGS] Failed to send ${emailType} to ${user.email}:`, emailResult.error);
          errors++;
        }

      } catch (error) {
        console.error(`[TRIAL-WARNINGS] Error processing user ${user.email}:`, error);
        errors++;
      }
    }

    console.log(`[TRIAL-WARNINGS] Process complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Trial warning process completed. Sent ${emailsSent} emails with ${errors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TRIAL-WARNINGS] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Reuse the email retry function from send-motivation-email
const sendEmailWithRetry = async (
  emailData: any,
  userId: string | null = null,
  goalId: string | null = null,
  emailType: string = 'trial_warning',
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string }> => {
  
  // Log initial attempt
  await logEmailDelivery(userId, goalId, emailType, emailData.to[0], emailData.subject, 'pending');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} for ${emailData.to[0]}`);
      
      const result = await resend.emails.send(emailData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Log successful delivery
      await logEmailDelivery(userId, goalId, emailType, emailData.to[0], emailData.subject, 'sent', result.data?.id);
      
      console.log(`✅ Email sent successfully on attempt ${attempt}:`, result.data?.id);
      return { success: true, data: result.data };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Email attempt ${attempt}/${maxRetries} failed:`, errorMessage);
      
      if (attempt === maxRetries) {
        await logEmailDelivery(userId, goalId, emailType, emailData.to[0], emailData.subject, 'failed', undefined, errorMessage);
        return { success: false, error: errorMessage };
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
};

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

serve(handler);