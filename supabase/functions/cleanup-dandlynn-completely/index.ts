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

    console.log('🧹 COMPLETE CLEANUP: Removing ALL dandlynn@yahoo.com data');

    // Delete motivation_history first (has foreign keys)
    const { error: motivationError } = await supabase
      .from('motivation_history')
      .delete()
      .eq('user_id', 'dandlynn@yahoo.com');

    console.log('🗑️ Deleted motivation_history:', motivationError || 'Success');

    // Delete goals next
    const { error: goalsError } = await supabase
      .from('goals')
      .delete()
      .eq('user_id', 'dandlynn@yahoo.com');

    console.log('🗑️ Deleted goals:', goalsError || 'Success');

    // Delete subscribers
    const { error: subscribersError } = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', 'dandlynn@yahoo.com');

    console.log('🗑️ Deleted subscribers:', subscribersError || 'Success');

    // Delete ALL profiles with dandlynn@yahoo.com email
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', 'dandlynn@yahoo.com');

    console.log('🗑️ Deleted profiles:', profilesError || 'Success');

    // Also delete the extra dandlynn@gmail.com profile
    const { error: extraProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', 'gOeAZxe7PDSIbx5l61TxzD6rpsp2');

    console.log('🗑️ Deleted extra dandlynn@gmail.com profile:', extraProfileError || 'Success');

    // Show final counts
    const { data: finalProfiles } = await supabase.from('profiles').select('*');
    const { data: finalGoals } = await supabase.from('goals').select('*').eq('is_active', true);

    console.log('✅ CLEANUP COMPLETE');
    console.log(`📊 Remaining profiles: ${finalProfiles?.length}`);
    console.log(`📊 Remaining active goals: ${finalGoals?.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'dandlynn@yahoo.com completely cleaned',
      remainingProfiles: finalProfiles?.length,
      remainingGoals: finalGoals?.length,
      profiles: finalProfiles?.map(p => ({ id: p.id, email: p.email })),
      goals: finalGoals?.map(g => ({ title: g.title, user_id: g.user_id }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});