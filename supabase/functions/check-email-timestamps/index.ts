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

    console.log(`[CHECK-EMAIL-TIMESTAMPS] Checking email timestamps at ${now.toISOString()} (${easternTime} Eastern)`);

    // Check goals with detailed timestamps
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, updated_at, created_at')
      .eq('is_active', true);

    if (goalsError) {
      throw new Error(`Goals query failed: ${goalsError.message}`);
    }

    // Get motivation history for today to see exact send times
    const { data: motivationHistory, error: historyError } = await supabase
      .from('motivation_history')
      .select('goal_id, created_at, message')
      .gte('created_at', '2025-09-20T00:00:00Z')
      .lte('created_at', '2025-09-23T23:59:59Z')
      .order('created_at', { ascending: false });

    const goalsWithTimestamps = goals?.map(goal => {
      // Convert UTC timestamps to Eastern time for display
      const lastMotivationUTC = goal.last_motivation_date ? new Date(goal.last_motivation_date) : null;
      const lastMotivationEastern = lastMotivationUTC ? lastMotivationUTC.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : null;

      // Find recent motivation history for this goal
      const recentHistory = motivationHistory?.filter(h => h.goal_id === goal.id) || [];

      return {
        id: goal.id,
        title: goal.title,
        user_id: goal.user_id,
        last_motivation_date_utc: goal.last_motivation_date,
        last_motivation_date_eastern: lastMotivationEastern,
        recent_motivation_history: recentHistory.map(h => ({
          created_at_utc: h.created_at,
          created_at_eastern: new Date(h.created_at).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            hour12: true,
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          message_preview: h.message?.substring(0, 100) || 'No message'
        }))
      };
    }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: {
          utc: now.toISOString(),
          eastern: easternTime
        },
        analysis: {
          totalActiveGoals: goals?.length || 0,
          allGoalsHaveEmailsToday: goals?.every(g => 
            g.last_motivation_date && 
            g.last_motivation_date.startsWith('2025-09-20')
          ) || false,
          goals: goalsWithTimestamps,
          recentMotivationHistory: motivationHistory?.length || 0
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CHECK-EMAIL-TIMESTAMPS] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        message: 'Failed to check email timestamps'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);