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
    console.log('[DISABLE-CRON] Starting surgical cron job removal');
    
    // Use service role to access database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      step1_check: null,
      step2_disable: null,
      step3_verify: null
    };

    // Step 1: Check what cron jobs exist
    console.log('[DISABLE-CRON] Step 1: Checking existing cron jobs');
    try {
      const { data: existingJobs, error: checkError } = await supabase
        .rpc('sql', { 
          query: "SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'daily-motivation-emails' OR jobname ILIKE '%email%' OR jobname ILIKE '%daily%';" 
        });
      
      if (checkError) {
        console.log('[DISABLE-CRON] Direct cron query failed, cron extension may not be enabled');
        results.step1_check = { 
          status: 'cron_not_accessible', 
          message: 'Cannot access cron.job table - extension may not be enabled or accessible',
          error: checkError.message
        };
      } else {
        results.step1_check = { 
          status: 'success', 
          jobs: existingJobs,
          message: `Found ${existingJobs?.length || 0} cron jobs`
        };
        console.log('[DISABLE-CRON] Found cron jobs:', existingJobs);
      }
    } catch (error) {
      results.step1_check = { 
        status: 'error', 
        message: 'Failed to check cron jobs',
        error: error.message
      };
    }

    // Step 2: Disable the specific cron job if it exists
    if (results.step1_check?.status === 'success') {
      console.log('[DISABLE-CRON] Step 2: Disabling daily-motivation-emails cron job');
      try {
        const { data: unscheduleResult, error: unscheduleError } = await supabase
          .rpc('sql', { 
            query: "SELECT cron.unschedule('daily-motivation-emails');" 
          });
        
        if (unscheduleError) {
          results.step2_disable = { 
            status: 'error', 
            message: 'Failed to unschedule cron job',
            error: unscheduleError.message
          };
        } else {
          results.step2_disable = { 
            status: 'success', 
            message: 'Successfully unscheduled daily-motivation-emails cron job',
            result: unscheduleResult
          };
          console.log('[DISABLE-CRON] Cron job unscheduled successfully');
        }
      } catch (error) {
        results.step2_disable = { 
          status: 'error', 
          message: 'Exception while unscheduling cron job',
          error: error.message
        };
      }

      // Step 3: Verify it's gone
      console.log('[DISABLE-CRON] Step 3: Verifying cron job is removed');
      try {
        const { data: verifyJobs, error: verifyError } = await supabase
          .rpc('sql', { 
            query: "SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'daily-motivation-emails';" 
          });
        
        if (verifyError) {
          results.step3_verify = { 
            status: 'error', 
            message: 'Failed to verify removal',
            error: verifyError.message
          };
        } else {
          results.step3_verify = { 
            status: 'success', 
            jobs: verifyJobs,
            message: verifyJobs?.length === 0 ? 'Confirmed: Cron job successfully removed' : 'Warning: Cron job may still exist'
          };
        }
      } catch (error) {
        results.step3_verify = { 
          status: 'error', 
          message: 'Exception while verifying removal',
          error: error.message
        };
      }
    } else {
      results.step2_disable = { status: 'skipped', message: 'Skipped due to check failure' };
      results.step3_verify = { status: 'skipped', message: 'Skipped due to check failure' };
    }

    const success = results.step2_disable?.status === 'success';
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 
          'Surgical cron removal completed successfully' : 
          'Cron removal failed or was not needed',
        details: results,
        recommendation: success ?
          'External cron should now be the only email system running' :
          'May need manual intervention via Supabase SQL Editor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[DISABLE-CRON] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Failed to disable duplicate cron job'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);