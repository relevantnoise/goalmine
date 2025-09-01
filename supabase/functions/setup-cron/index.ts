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
    console.log('[SETUP-CRON] Setting up daily cron job for GoalMine.ai emails');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to enable pg_cron extension
    const { data: extensionData, error: extensionError } = await supabase
      .rpc('sql', {
        query: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
      });

    if (extensionError) {
      console.log('[SETUP-CRON] pg_cron extension not available, will use alternative method');
    } else {
      console.log('[SETUP-CRON] pg_cron extension enabled');
    }

    // Try to set up the cron job for 7 AM Eastern (11 AM UTC during EST, 10 AM UTC during EDT)
    // Using 11 AM UTC as safe time (covers EST)
    const cronJobSQL = `
      SELECT cron.schedule(
        'daily-goalmine-emails',
        '0 11 * * *', 
        $$
        SELECT
          net.http_post(
            url := 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
            body := '{}'::jsonb
          ) as request_id;
        $$
      );
    `;

    const { data: cronData, error: cronError } = await supabase
      .rpc('sql', {
        query: cronJobSQL
      });

    if (cronError) {
      console.error('[SETUP-CRON] Failed to set up cron job:', cronError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to set up cron job',
          details: cronError.message,
          alternative: 'You can set up external cron service to call: https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron daily at 7 AM Eastern'
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('[SETUP-CRON] Cron job set up successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily cron job scheduled for 11 AM UTC (7 AM Eastern)',
        schedule: '0 11 * * *',
        endpoint: 'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron',
        note: 'Emails will be sent daily at 7 AM Eastern Time'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[SETUP-CRON] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        alternative: 'Set up external cron service to call daily-cron function'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);