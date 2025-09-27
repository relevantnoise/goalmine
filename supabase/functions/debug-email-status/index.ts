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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time info
    const now = new Date();
    const utcDate = now.toISOString().split('T')[0];
    const easternDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York'
    }).format(now);
    const midwayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Midway'
    }).format(now);

    // Check active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, user_id, is_active, last_motivation_date, created_at')
      .eq('is_active', true)
      .limit(10);

    // Count goals needing processing
    const { data: needingProcessing, error: processingError } = await supabase
      .from('goals')
      .select('id, title, last_motivation_date')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${midwayDate}`);

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(5);

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          currentTime: {
            utc: now.toISOString(),
            utcDate,
            easternDate,
            midwayDate: midwayDate,
            comparison: `UTC: ${utcDate}, Eastern: ${easternDate}, Midway: ${midwayDate}`
          },
          goals: {
            totalActive: goals?.length || 0,
            needingProcessing: needingProcessing?.length || 0,
            sampleGoals: goals?.slice(0, 3) || [],
            sampleNeedingProcessing: needingProcessing?.slice(0, 3) || []
          },
          profiles: {
            total: profiles?.length || 0,
            sample: profiles?.slice(0, 3) || []
          },
          errors: {
            goals: goalsError,
            processing: processingError,
            profiles: profilesError
          }
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);