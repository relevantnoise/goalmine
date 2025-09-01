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

    // 1. Send daily motivation emails
    try {
      console.log('[DAILY-CRON] Invoking send-daily-emails function');
      const dailyEmailsResponse = await supabase.functions.invoke('send-daily-emails', {});
      
      if (dailyEmailsResponse.error) {
        throw new Error(dailyEmailsResponse.error.message);
      }
      
      results.dailyEmails = {
        success: true,
        emailsSent: dailyEmailsResponse.data?.emailsSent || 0,
        errors: dailyEmailsResponse.data?.errors || 0,
        message: dailyEmailsResponse.data?.message || 'Daily emails processed'
      };
      
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

    // 2. Send trial warning emails
    try {
      console.log('[DAILY-CRON] Invoking send-trial-warning function');
      const trialWarningsResponse = await supabase.functions.invoke('send-trial-warning', {});
      
      if (trialWarningsResponse.error) {
        throw new Error(trialWarningsResponse.error.message);
      }
      
      results.trialWarnings = {
        success: true,
        emailsSent: trialWarningsResponse.data?.emailsSent || 0,
        errors: trialWarningsResponse.data?.errors || 0,
        message: trialWarningsResponse.data?.message || 'Trial warnings processed'
      };
      
      console.log('[DAILY-CRON] Trial warnings result:', results.trialWarnings);
      
    } catch (error) {
      console.error('[DAILY-CRON] Error in trial warnings:', error);
      results.trialWarnings = {
        success: false,
        emailsSent: 0,
        errors: 1,
        message: `Failed to send trial warnings: ${error.message}`
      };
    }

    // 3. Clean up old email delivery logs (optional - keep last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error: cleanupError } = await supabase
        .from('email_deliveries')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      if (cleanupError) {
        console.error('[DAILY-CRON] Error cleaning up old email logs:', cleanupError);
      } else {
        console.log('[DAILY-CRON] Cleaned up email delivery logs older than 30 days');
      }
    } catch (error) {
      console.error('[DAILY-CRON] Error in cleanup:', error);
    }

    // 4. Clean up old nudge records (keep last 7 days only)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { error: nudgeCleanupError } = await supabase
        .from('daily_nudges')
        .delete()
        .lt('nudge_date', sevenDaysAgo.toISOString().split('T')[0]);
      
      if (nudgeCleanupError) {
        console.error('[DAILY-CRON] Error cleaning up old nudge records:', nudgeCleanupError);
      } else {
        console.log('[DAILY-CRON] Cleaned up nudge records older than 7 days');
      }
    } catch (error) {
      console.error('[DAILY-CRON] Error in nudge cleanup:', error);
    }

    const totalEmailsSent = results.dailyEmails.emailsSent + results.trialWarnings.emailsSent;
    const totalErrors = results.dailyEmails.errors + results.trialWarnings.errors;
    const overallSuccess = results.dailyEmails.success && results.trialWarnings.success;

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