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
    console.log('[RESET-TEST-GOALS] Resetting goals for testing');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Find all goals for our test users
    const { data: allGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);
    
    console.log('[RESET-TEST-GOALS] All active goals:', allGoals?.length);
    
    // Find goals that could belong to our test users
    const testUserGoals = allGoals?.filter(g => 
      g.user_id === 'danlynn@gmail.com' || 
      g.user_id === 'dandlynn@yahoo.com' ||
      g.user_id.length > 20 // Could be Firebase UID
    ) || [];
    
    console.log('[RESET-TEST-GOALS] Test user goals found:', testUserGoals.length);
    testUserGoals.forEach(g => {
      console.log(`- Goal: "${g.title}" (user_id: ${g.user_id}, last_motivation: ${g.last_motivation_date})`);
    });
    
    // Also check profiles to find Firebase UIDs
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('email', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);
    
    console.log('[RESET-TEST-GOALS] Profiles found:', profiles?.length);
    profiles?.forEach(p => {
      console.log(`- Profile: ${p.email} (id: ${p.id})`);
    });
    
    // Find Firebase UID-based goals
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.map(p => p.id);
      const { data: uidGoals } = await supabase
        .from('goals')
        .select('*')
        .in('user_id', profileIds)
        .eq('is_active', true);
      
      console.log('[RESET-TEST-GOALS] Firebase UID goals found:', uidGoals?.length);
      uidGoals?.forEach(g => {
        console.log(`- UID Goal: "${g.title}" (user_id: ${g.user_id}, last_motivation: ${g.last_motivation_date})`);
      });
    }
    
    // Reset a few goals to yesterday so they can be processed
    const goalsToReset = testUserGoals.slice(0, 3);
    if (goalsToReset.length > 0) {
      const goalIds = goalsToReset.map(g => g.id);
      const { data: resetResult } = await supabase
        .from('goals')
        .update({ last_motivation_date: yesterday })
        .in('id', goalIds)
        .select('*');
      
      console.log('[RESET-TEST-GOALS] Reset goals:', resetResult?.length);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        yesterday,
        allActiveGoals: allGoals?.length || 0,
        testUserGoals: testUserGoals.length,
        profiles: profiles?.length || 0,
        goalsReset: goalsToReset.length,
        details: {
          testUserGoals: testUserGoals.map(g => ({
            id: g.id,
            title: g.title,
            user_id: g.user_id,
            last_motivation_date: g.last_motivation_date
          })),
          profiles: profiles?.map(p => ({ email: p.email, id: p.id }))
        }
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[RESET-TEST-GOALS] Error:', error);
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