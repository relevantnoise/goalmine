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
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[DEBUG-CRON] Checking for cron jobs...');

    // Query cron jobs directly from the cron schema
    const { data: cronJobs, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            jobname, 
            schedule, 
            active,
            created_at::text,
            command
          FROM cron.job 
          WHERE 
            jobname ILIKE '%email%' 
            OR jobname ILIKE '%daily%'
            OR jobname ILIKE '%motivation%'
            OR command ILIKE '%email%'
            OR command ILIKE '%trigger%'
          ORDER BY created_at DESC;
        `
      });

    if (error) {
      console.error('[DEBUG-CRON] Error querying cron jobs:', error);
      
      // Try alternative approach - check all cron jobs
      const { data: allCronJobs, error: allError } = await supabase
        .rpc('exec_sql', {
          query: 'SELECT jobname, schedule, active, created_at::text FROM cron.job ORDER BY created_at DESC;'
        });

      if (allError) {
        throw new Error(`Failed to query cron jobs: ${allError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Found cron jobs (fallback query)',
        cronJobs: allCronJobs || [],
        totalJobs: allCronJobs?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[DEBUG-CRON] Found ${cronJobs?.length || 0} email-related cron jobs`);

    return new Response(JSON.stringify({
      success: true,
      message: `Found ${cronJobs?.length || 0} email-related cron jobs`,
      cronJobs: cronJobs || [],
      totalJobs: cronJobs?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[DEBUG-CRON] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);