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
    console.log('[AUTO-SCHEDULE] FUNCTION DISABLED - External service is causing conflicts with cron-job.org');

    // DISABLED: This function was being called by an unknown external service (likely UptimeRobot)
    // which was triggering emails at 7:00 AM Eastern (3:00 AM EDT during DST), 
    // causing conflicts with the intended 6:00 AM EDT cron-job.org schedule.
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Function disabled - using cron-job.org for scheduling instead',
        timestamp: new Date().toISOString(),
        status: 'disabled'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[AUTO-SCHEDULE] Fatal error:', error);
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