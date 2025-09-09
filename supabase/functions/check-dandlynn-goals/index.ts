import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get ALL goals for dandlynn@yahoo.com (active and inactive)
    const { data: allGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'dandlynn@yahoo.com')
      .order('created_at', { ascending: false });

    console.log('=== ALL DANDLYNN@YAHOO.COM GOALS ===');
    allGoals?.forEach(g => {
      console.log(`${g.title}: active=${g.is_active}, created=${g.created_at}, target=${g.target_date}`);
    });

    return new Response(JSON.stringify({
      totalGoals: allGoals?.length,
      activeGoals: allGoals?.filter(g => g.is_active).length,
      inactiveGoals: allGoals?.filter(g => !g.is_active).length,
      goals: allGoals?.map(g => ({
        title: g.title,
        active: g.is_active,
        created: g.created_at,
        target: g.target_date,
        streak: g.streak_count
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});