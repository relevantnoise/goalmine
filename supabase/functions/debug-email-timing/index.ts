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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log(`[DEBUG-EMAIL-TIMING] Checking database state at ${now.toISOString()} (${easternTime} Eastern)`);

    // Check active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, is_active, target_date, created_at')
      .eq('is_active', true);

    if (goalsError) {
      throw new Error(`Goals query failed: ${goalsError.message}`);
    }

    // Check today's date in different formats
    const today = new Date();
    const todayEST = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const todayISOString = today.toISOString().split('T')[0];
    const todayESTString = todayEST.toISOString().split('T')[0];

    // Check which goals should get emails today
    const eligibleGoals = goals?.filter(goal => {
      if (!goal.last_motivation_date) return true; // Never sent an email
      
      const lastEmailDate = new Date(goal.last_motivation_date).toISOString().split('T')[0];
      return lastEmailDate !== todayISOString;
    }) || [];

    // Check profiles and subscriptions
    const userIds = goals?.map(g => g.user_id) || [];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, trial_expires_at')
      .in('id', userIds.filter(id => !id.includes('@')));

    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('user_id, subscribed, plan_name')
      .in('user_id', userIds.filter(id => id.includes('@')));

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: {
          utc: now.toISOString(),
          eastern: easternTime
        },
        debugging: {
          todayISOString,
          todayESTString,
          totalActiveGoals: goals?.length || 0,
          eligibleForEmail: eligibleGoals.length,
          goals: goals?.map(goal => ({
            id: goal.id,
            title: goal.title,
            user_id: goal.user_id,
            last_motivation_date: goal.last_motivation_date,
            target_date: goal.target_date,
            eligible: !goal.last_motivation_date || 
              new Date(goal.last_motivation_date).toISOString().split('T')[0] !== todayISOString
          })) || [],
          profiles: profiles || [],
          subscribers: subscribers || [],
          errors: {
            goalsError: goalsError?.message || null,
            profilesError: profilesError?.message || null,
            subscribersError: subscribersError?.message || null
          }
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-EMAIL-TIMING] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'Failed to debug email timing'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);