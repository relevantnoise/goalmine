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
    console.log('[CHECK-CRON] Checking active cron jobs');

    // Query cron jobs directly from the database
    const { data: cronJobs, error } = await supabase
      .from('cron.job')
      .select('*')
      .or('jobname.ilike.%email%,jobname.ilike.%daily%');

    if (error) {
      console.error('[CHECK-CRON] Error querying cron jobs:', error);
      throw error;
    }

    console.log('[CHECK-CRON] Found cron jobs:', cronJobs);

    return new Response(
      JSON.stringify({ 
        success: true,
        cronJobs: cronJobs || [],
        message: `Found ${cronJobs?.length || 0} cron jobs`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CHECK-CRON] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        cronJobs: []
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);