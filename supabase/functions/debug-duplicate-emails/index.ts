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
    const { userId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[DEBUG-DUPLICATE] Investigating duplicate emails for user: ${userId}`);

    // Get user's active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (goalsError) {
      throw goalsError;
    }

    // Get today's motivation history
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysMotivation, error: motivationError } = await supabase
      .from('motivation_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: true });

    if (motivationError) {
      throw motivationError;
    }

    // Group motivation entries by goal_id to see duplicates
    const motivationByGoal = {};
    todaysMotivation?.forEach(entry => {
      if (!motivationByGoal[entry.goal_id]) {
        motivationByGoal[entry.goal_id] = [];
      }
      motivationByGoal[entry.goal_id].push(entry);
    });

    const analysis = {
      user: userId,
      date: today,
      activeGoals: goals?.length || 0,
      goalDetails: goals?.map(g => ({
        id: g.id,
        title: g.title,
        lastMotivationDate: g.last_motivation_date,
        streakCount: g.streak_count
      })),
      todaysMotivationEntries: todaysMotivation?.length || 0,
      motivationByGoal: Object.keys(motivationByGoal).map(goalId => ({
        goalId,
        goalTitle: goals?.find(g => g.id === goalId)?.title || 'Unknown',
        entriesCount: motivationByGoal[goalId].length,
        entries: motivationByGoal[goalId].map(e => ({
          id: e.id,
          createdAt: e.created_at,
          streakCount: e.streak_count
        }))
      })),
      potentialDuplicates: Object.keys(motivationByGoal).filter(goalId => motivationByGoal[goalId].length > 1)
    };

    console.log('[DEBUG-DUPLICATE] Analysis:', JSON.stringify(analysis, null, 2));

    return new Response(
      JSON.stringify(analysis),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-DUPLICATE] Error:', error);
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