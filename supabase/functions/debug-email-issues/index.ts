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
    console.log('[DEBUG-EMAIL-ISSUES] Starting diagnostic');

    // Check the current state of both users and their goals
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('email', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);

    if (profilesError) {
      console.error('[DEBUG-EMAIL-ISSUES] Error fetching profiles:', profilesError);
    }

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);

    if (goalsError) {
      console.error('[DEBUG-EMAIL-ISSUES] Error fetching goals:', goalsError);
    }

    // Check subscription status
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscribers')
      .select('*')
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);

    if (subscriptionsError) {
      console.error('[DEBUG-EMAIL-ISSUES] Error fetching subscriptions:', subscriptionsError);
    }

    // Check recent motivation history
    const { data: motivationHistory, error: motivationError } = await supabase
      .from('motivation_history')
      .select('*')
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (motivationError) {
      console.error('[DEBUG-EMAIL-ISSUES] Error fetching motivation history:', motivationError);
    }

    // Get today's date for comparison
    const today = new Date().toISOString().split('T')[0];

    const results = {
      timestamp: new Date().toISOString(),
      today: today,
      profiles: profiles || [],
      goals: goals || [],
      subscriptions: subscriptions || [],
      motivationHistory: motivationHistory || [],
      analysis: {
        danlynn: {
          profileExists: profiles?.some(p => p.email === 'danlynn@gmail.com') || false,
          goalsCount: goals?.filter(g => g.user_id === 'danlynn@gmail.com' && g.is_active).length || 0,
          goalsWithTodaysMotivationDate: goals?.filter(g => g.user_id === 'danlynn@gmail.com' && g.last_motivation_date === today).length || 0,
          isSubscribed: subscriptions?.some(s => s.user_id === 'danlynn@gmail.com' && s.status === 'active') || false
        },
        dandlynn: {
          profileExists: profiles?.some(p => p.email === 'dandlynn@yahoo.com') || false,
          goalsCount: goals?.filter(g => g.user_id === 'dandlynn@yahoo.com' && g.is_active).length || 0,
          goalsWithTodaysMotivationDate: goals?.filter(g => g.user_id === 'dandlynn@yahoo.com' && g.last_motivation_date === today).length || 0,
          isSubscribed: subscriptions?.some(s => s.user_id === 'dandlynn@yahoo.com' && s.status === 'active') || false
        }
      }
    };

    console.log('[DEBUG-EMAIL-ISSUES] Analysis results:', JSON.stringify(results.analysis, null, 2));

    return new Response(
      JSON.stringify(results),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-EMAIL-ISSUES] Error:', error);
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