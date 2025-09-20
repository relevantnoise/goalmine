import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get current Eastern Time for logging
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log(`[EXTERNAL-TRIGGER] DISABLED - Function called at ${now.toISOString()} (${easternTime} Eastern)`);
    
    // Log request details to identify what's calling this
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const origin = req.headers.get('origin') || 'unknown';
    const referer = req.headers.get('referer') || 'unknown';
    const xForwardedFor = req.headers.get('x-forwarded-for') || 'unknown';
    
    console.log(`[EXTERNAL-TRIGGER] REQUEST DETAILS (FOR DEBUGGING):`);
    console.log(`[EXTERNAL-TRIGGER] User-Agent: ${userAgent}`);
    console.log(`[EXTERNAL-TRIGGER] Origin: ${origin}`);
    console.log(`[EXTERNAL-TRIGGER] Referer: ${referer}`);
    console.log(`[EXTERNAL-TRIGGER] X-Forwarded-For: ${xForwardedFor}`);
    console.log(`[EXTERNAL-TRIGGER] All headers:`, Object.fromEntries(req.headers.entries()));

    // DISABLED - No longer trigger emails from this function
    console.log('[EXTERNAL-TRIGGER] Function disabled - not calling daily-cron');

    return new Response(
      JSON.stringify({
        success: false,
        message: 'External trigger function is disabled. Using Vercel cron only.',
        triggerTime: {
          utc: now.toISOString(),
          eastern: easternTime
        },
        note: 'This function has been disabled. Emails are now sent via Vercel cron at 11:00 UTC (7 AM EDT).',
        requestDetails: {
          userAgent,
          origin,
          referer,
          xForwardedFor
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[EXTERNAL-TRIGGER] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'Failed to trigger daily emails'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);