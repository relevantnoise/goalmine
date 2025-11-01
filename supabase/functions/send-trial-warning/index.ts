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
    console.log('[TRIAL-WARNINGS-FIXED] Starting trial warning email process');

    // Get users whose trials expire in 7 days, 3 days, or 1 day
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // FIXED: Get all users with trials expiring in the next 7 days
    const { data: candidateUsers, error: queryError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        trial_expires_at,
        created_at
      `)
      .not('trial_expires_at', 'is', null)
      .gte('trial_expires_at', now.toISOString())
      .lte('trial_expires_at', in7Days.toISOString());

    if (queryError) {
      console.error('[TRIAL-WARNINGS-FIXED] Error querying users:', queryError);
      throw queryError;
    }

    console.log(`[TRIAL-WARNINGS-FIXED] Found ${candidateUsers?.length || 0} candidate users`);

    let emailsSent = 0;
    let errors = 0;
    let excluded = 0;

    for (const user of candidateUsers || []) {
      try {
        // FIXED: Check if user is already a subscriber (hybrid architecture support)
        let isSubscriber = false;
        
        // Check by email (most common case)
        const { data: subscriberByEmail } = await supabase
          .from('subscribers')
          .select('subscribed')
          .eq('user_id', user.email)
          .eq('subscribed', true)
          .single();

        // Also check by Firebase UID (for proper architecture)
        const { data: subscriberById } = await supabase
          .from('subscribers')
          .select('subscribed')
          .eq('user_id', user.id)
          .eq('subscribed', true)
          .single();

        isSubscriber = !!(subscriberByEmail || subscriberById);

        if (isSubscriber) {
          console.log(`[TRIAL-WARNINGS-FIXED] Excluding ${user.email} - already subscribed`);
          excluded++;
          continue;
        }

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

        // FIXED: Better deduplication - check by email address since that's more reliable
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const { data: existingEmails } = await supabase
          .from('email_deliveries')
          .select('id, email_type')
          .eq('recipient_email', user.email)  // Use email instead of user_id
          .eq('email_type', emailType)
          .eq('status', 'sent')
          .gte('created_at', todayStart.toISOString()) // Check for today only
          .order('created_at', { ascending: false });

        if (existingEmails && existingEmails.length > 0) {
          console.log(`[TRIAL-WARNINGS-FIXED] Skipping ${emailType} for ${user.email} - already sent today (${existingEmails.length} times)`);
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
              <p style="color: #666; font-size: 16px;">Master life's complexities with proven systematic frameworks</p>
            </div>
            
            <div style="background: ${daysRemaining <= 1 ? '#fee2e2' : '#fef3c7'}; border: 2px solid ${daysRemaining <= 1 ? '#dc2626' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
              <h2 style="color: ${daysRemaining <= 1 ? '#dc2626' : '#d97706'}; font-size: 24px; margin-bottom: 15px;">
                ${daysRemaining <= 1 ? '⏰ Final Day!' : `⏰ ${daysRemaining} Days Remaining`}
              </h2>
              <p style="color: ${daysRemaining <= 1 ? '#7f1d1d' : '#92400e'}; font-size: 16px; margin-bottom: 15px;">
                ${daysRemaining <= 1 
                  ? 'Your free trial ends tomorrow! Don\'t lose access to your 6 Pillars Framework™ experience and strategic insights.'
                  : `Your 30-day free trial expires in ${daysRemaining} days. Continue your systematic approach to life management!`
                }
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 20px; margin-bottom: 15px;">✨ Continue Your Strategic Life Management</h3>
              <ul style="color: #555; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li><strong>Full 6 Pillars of Life Framework™</strong> - Systematic complexity management</li>
                <li><strong>Business Happiness Formula™</strong> - Professional satisfaction optimization</li>
                <li><strong>Up to 3 goals across pillars</strong> - Address multiple life domains</li>
                <li><strong>AI-powered insights</strong> - Strategic guidance for your unique situation</li>
                <li><strong>Daily personalized motivation</strong> - 4 coaching tones available</li>
                <li><strong>Priority support</strong> - Get help when you need it</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://goalmine.ai/?view=upgrade&utm_source=trial_warning&utm_campaign=${emailType}" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                🚀 Continue Your Journey - Starting as low as $24.99/month
              </a>
            </div>

            <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
              <p style="color: #0277bd; font-size: 14px; margin: 0;">
                💡 <strong>30-year proven frameworks</strong> • Professional Plan available ($199.99) • Cancel anytime
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                GoalMine.ai - Transform scattered goals into integrated life management<br>
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

        // Send the email with custom domain
        const emailResult = await sendEmailWithRetry({
          from: "GoalMine.ai <noreply@notifications.goalmine.ai>", // Fixed: use custom domain
          to: [user.email],
          subject: emailSubject,
          html: emailHTML,
        }, user.id, null, emailType);

        if (emailResult.success) {
          console.log(`[TRIAL-WARNINGS-FIXED] ✅ Sent ${emailType} to ${user.email} (${daysRemaining} days remaining)`);
          emailsSent++;
        } else {
          console.error(`[TRIAL-WARNINGS-FIXED] ❌ Failed to send ${emailType} to ${user.email}:`, emailResult.error);
          errors++;
        }

      } catch (error) {
        console.error(`[TRIAL-WARNINGS-FIXED] Error processing user ${user.email}:`, error);
        errors++;
      }
    }

    console.log(`[TRIAL-WARNINGS-FIXED] Process complete. Sent: ${emailsSent}, Errors: ${errors}, Excluded: ${excluded}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        excluded,
        message: `Trial warning process completed. Sent ${emailsSent} emails, ${errors} errors, ${excluded} excluded (already subscribed).`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TRIAL-WARNINGS-FIXED] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Reuse the email retry function
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