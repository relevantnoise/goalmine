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

    console.log(`[EXTERNAL-TRIGGER] Daily email trigger called at ${now.toISOString()} (${easternTime} Eastern)`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the daily-cron function directly
    console.log('[EXTERNAL-TRIGGER] Calling daily-cron function');
    const cronResponse = await supabase.functions.invoke('daily-cron', {
      body: {},
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });

    if (cronResponse.error) {
      console.error('[EXTERNAL-TRIGGER] Error calling daily-cron:', cronResponse.error);
      throw new Error(cronResponse.error.message);
    }

    const result = cronResponse.data;
    console.log('[EXTERNAL-TRIGGER] Daily-cron completed successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily emails triggered successfully via external cron',
        triggerTime: {
          utc: now.toISOString(),
          eastern: easternTime
        },
        results: result,
        note: 'Emails should be delivered within minutes'
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