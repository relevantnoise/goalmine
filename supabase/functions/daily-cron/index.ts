import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DAILY-CRON] Starting daily cron job execution');

    const results = {
      dailyEmails: { success: false, emailsSent: 0, errors: 0, message: '' },
      trialWarnings: { success: false, emailsSent: 0, errors: 0, message: '' },
      timestamp: new Date().toISOString()
    };

    // 1. Send daily motivation emails - NEW CONSOLIDATED SYSTEM
    // Safety switch: Change to false to revert to old goal-specific emails
    const USE_CONSOLIDATED_EMAILS = true;
    
    try {
      let dailyEmailsResponse;
      
      if (USE_CONSOLIDATED_EMAILS) {
        console.log('[DAILY-CRON] 🚀 NEW SYSTEM: Using consolidated wake-up call - ONE email per user');
        
        dailyEmailsResponse = await supabase.functions.invoke('send-daily-wake-up-call', {
          body: {},
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
        });
        
      } else {
        console.log('[DAILY-CRON] 🔄 OLD SYSTEM: Using goal-specific emails - multiple emails per user');
        
        // OLD SYSTEM: Direct database approach with goal-specific emails
        const todayUTC = new Date().toISOString().split('T')[0];
        console.log('[DAILY-CRON] Today UTC:', todayUTC);
        
        // Get active goals
        const { data: activeGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('is_active', true);
        
        console.log(`[DAILY-CRON] Found ${activeGoals?.length || 0} active goals`);
        
        let emailsSent = 0;
        let emailErrors = 0;
        
        if (activeGoals && activeGoals.length > 0) {
          for (const goal of activeGoals) {
            try {
              console.log(`[DAILY-CRON] Processing goal: "${goal.title}" for ${goal.user_id}`);
              
              // Get email
              let email = goal.user_id;
              if (!email.includes('@')) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('email')
                  .eq('id', goal.user_id)
                  .single();
                email = profile?.email;
              }
              
              if (!email) {
                console.error(`[DAILY-CRON] No email for goal: ${goal.title}`);
                emailErrors++;
                continue;
              }
              
              console.log(`[DAILY-CRON] Sending email to: ${email}`);
              
              // Send goal-specific email
              const emailResponse = await supabase.functions.invoke('send-motivation-email', {
                body: {
                  email: email,
                  name: email.split('@')[0],
                  goal: goal.title,
                  message: `Good morning! Time to work on "${goal.title}". Today is a perfect day to make progress.`,
                  microPlan: ['Take one step forward', 'Track your progress', 'Visualize success'],
                  challenge: 'Spend 2 minutes planning your next action.',
                  streak: goal.streak_count || 0,
                  redirectUrl: 'https://goalmine.ai',
                  isNudge: false,
                  userId: goal.user_id,
                  goalId: goal.id
                }
              });
              
              // Check BOTH error AND success status
              if (emailResponse.error || !emailResponse.data?.success) {
                console.error(`[DAILY-CRON] Email failed for ${goal.title}:`, emailResponse.error || 'Success=false');
                emailErrors++;
              } else {
                console.log(`[DAILY-CRON] ✅ Email sent for ${goal.title}`);
                
                // Mark as sent after confirmed successful delivery
                await supabase
                  .from('goals')
                  .update({ last_motivation_date: todayUTC })
                  .eq('id', goal.id);
                
                emailsSent++;
              }
            } catch (error) {
              console.error(`[DAILY-CRON] Error processing ${goal.title}:`, error);
              emailErrors++;
            }
          }
        }
        
        dailyEmailsResponse = {
          data: {
            success: true,
            emailsSent,
            errors: emailErrors,
            message: `OLD SYSTEM: Sent ${emailsSent} individual emails with ${emailErrors} errors`
          },
          error: null
        };
      }
      
      console.log('[DAILY-CRON] Raw daily emails response:', dailyEmailsResponse);
      
      // Check if response has data even if there's an error
      if (dailyEmailsResponse.data) {
        results.dailyEmails = {
          success: dailyEmailsResponse.data.success || false,
          emailsSent: dailyEmailsResponse.data.emailsSent || 0,
          errors: dailyEmailsResponse.data.errors || 0,
          message: dailyEmailsResponse.data.message || 'Daily emails processed'
        };
      } else if (dailyEmailsResponse.error) {
        throw new Error(dailyEmailsResponse.error.message);
      } else {
        throw new Error('No response data from send-daily-emails');
      }
      
      console.log('[DAILY-CRON] Daily emails result:', results.dailyEmails);
      
    } catch (error) {
      console.error('[DAILY-CRON] Error in daily emails:', error);
      results.dailyEmails = {
        success: false,
        emailsSent: 0,
        errors: 1,
        message: `Failed to send daily emails: ${error.message}`
      };
    }

    // 2. Trial warning emails - DISABLED FOR FREEMIUM MODEL
    // Previously sent countdown emails (7-day, 3-day, 1-day warnings)
    // Now disabled since users keep free access permanently
    console.log('[DAILY-CRON] 🚫 Trial warnings DISABLED - freemium model implemented');
    results.trialWarnings = {
      success: true,
      emailsSent: 0,
      errors: 0,
      message: 'Trial warnings disabled - freemium model active'
    };

    // Skip database cleanup to avoid potential table issues
    console.log('[DAILY-CRON] Skipping database cleanup (not critical for daily emails)');

    const totalEmailsSent = results.dailyEmails.emailsSent + results.trialWarnings.emailsSent;
    const totalErrors = results.dailyEmails.errors + results.trialWarnings.errors;
    // Success if daily emails work (trial warnings are not critical)
    const overallSuccess = results.dailyEmails.success;

    console.log('[DAILY-CRON] Cron job completed:', {
      totalEmailsSent,
      totalErrors,
      overallSuccess,
      timestamp: results.timestamp
    });

    return new Response(
      JSON.stringify({ 
        success: overallSuccess,
        totalEmailsSent,
        totalErrors,
        details: results,
        message: `Daily cron completed. Sent ${totalEmailsSent} emails with ${totalErrors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DAILY-CRON] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);