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

    console.log('[DEBUG-PRODUCTION] Checking production database for ryanlynn@umich.edu');
    console.log('[DEBUG-PRODUCTION] Supabase URL:', Deno.env.get('SUPABASE_URL'));
    console.log('[DEBUG-PRODUCTION] Environment check - this should be production');

    // Search more broadly for ryanlynn - check all possible formats
    const searchTerms = ['ryanlynn', 'umich', 'sXsgZAxPFzVHP567OJ7mYnaf4ye2'];
    
    // Check ALL goals with broader search
    const { data: allGoals, error: allGoalsError } = await supabase
      .from('goals')
      .select('*')
      .or(`user_id.ilike.%ryanlynn%,user_id.ilike.%umich%,user_id.eq.sXsgZAxPFzVHP567OJ7mYnaf4ye2`)
      .order('created_at', { ascending: false });

    console.log('[DEBUG-PRODUCTION] All goals search result:', { count: allGoals?.length, error: allGoalsError });

    // Also check goals created today
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysGoals, error: todaysError } = await supabase
      .from('goals')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    console.log('[DEBUG-PRODUCTION] Today\'s goals:', { count: todaysGoals?.length, error: todaysError });

    // Check profiles again
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .or('email.ilike.%ryanlynn%,email.ilike.%umich%,id.eq.sXsgZAxPFzVHP567OJ7mYnaf4ye2')
      .order('created_at', { ascending: false });

    // Check motivation history for today
    const { data: todaysMotivation, error: motivationError } = await supabase
      .from('motivation_history')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    console.log('[DEBUG-PRODUCTION] Today\'s motivation history:', { count: todaysMotivation?.length, error: motivationError });

    // Check recent email function executions
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const response = {
      environment: {
        supabaseUrl: Deno.env.get('SUPABASE_URL'),
        currentEasternTime: easternTime,
        currentUTC: now.toISOString(),
        searchDate: today
      },
      ryanlynGoals: allGoals || [],
      todaysGoals: todaysGoals?.map(g => ({
        id: g.id,
        title: g.title,
        user_id: g.user_id,
        created_at: g.created_at,
        is_active: g.is_active
      })) || [],
      profiles: profiles || [],
      todaysMotivationHistory: todaysMotivation?.map(m => ({
        id: m.id,
        goal_id: m.goal_id,
        user_id: m.user_id,
        created_at: m.created_at,
        message_preview: m.message?.substring(0, 100)
      })) || [],
      analysis: {
        ryanlynGoalsFound: allGoals?.length || 0,
        todaysGoalsTotal: todaysGoals?.length || 0,
        todaysMotivationEntries: todaysMotivation?.length || 0,
        profileFound: (profiles?.length || 0) > 0,
        possibleUserIds: profiles?.map(p => ({ id: p.id, email: p.email })) || []
      }
    };

    console.log('[DEBUG-PRODUCTION] Investigation complete');

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-PRODUCTION] Fatal error:', error);
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