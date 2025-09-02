import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SETUP-CRON] Setting up daily email cron job');

    // Instructions for manual cron setup
    const instructions = {
      message: "Daily email cron job setup instructions",
      steps: [
        "1. Go to Supabase Dashboard > Functions > daily-cron",
        "2. Click 'Add a new cron job'", 
        "3. Set schedule: '0 7 * * *' (7 AM UTC = 7 AM Eastern in winter, 11 AM Eastern in summer)",
        "4. Or use '0 11 * * *' for 7 AM Eastern year-round",
        "5. Set function: daily-cron",
        "6. Save the cron job"
      ],
      temporarySolution: "For now, you can manually trigger daily emails by calling this URL daily:",
      manualTriggerUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/daily-cron`,
      cronExpression: "0 7 * * *",
      timezone: "UTC (adjust as needed for Eastern Time)",
      note: "This function provides setup instructions. The actual daily emails are sent by the 'daily-cron' function."
    };

    return new Response(
      JSON.stringify(instructions),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-CRON] Error:', error);
    return new Response(
      JSON.stringify({ 
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