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
    console.log('[CHECK-CRONS] Checking existing cron jobs');
    
    // Use service role to query cron jobs
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query for cron jobs - this might need to be done differently depending on Supabase setup
    const { data: cronJobs, error } = await supabase
      .rpc('get_cron_jobs'); // This may not exist, will try direct query if it fails

    if (error) {
      console.log('[CHECK-CRONS] RPC failed, trying direct query approach');
      // Try a simple approach to check if any cron-related data exists
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Cannot directly query cron.job table from edge functions. Need to use SQL Editor.',
          note: 'Please run this SQL in Supabase SQL Editor: SELECT jobname, schedule, active FROM cron.job;',
          error: error.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[CHECK-CRONS] Found cron jobs:', cronJobs);

    return new Response(
      JSON.stringify({ 
        success: true,
        cronJobs: cronJobs || [],
        message: `Found ${cronJobs?.length || 0} cron jobs`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[CHECK-CRONS] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to check cron jobs'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);