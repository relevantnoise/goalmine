import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { goal_id, user_id } = await req.json();

    console.log('🔄 Resetting streak for goal:', goal_id, 'user:', user_id);

    if (!goal_id || !user_id) {
      throw new Error('Missing required fields: goal_id, user_id');
    }

    // Reset the goal's streak using service role (bypasses RLS)
    // First try to find and update the goal by goal_id and user_id (email format)
    let { data, error } = await supabaseAdmin
      .from('goals')
      .update({
        streak_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', goal_id)
      .eq('user_id', user_id)
      .select()
      .single();

    // If no goal found and user_id looks like email, try Firebase UID from profiles
    if (error && user_id.includes('@')) {
      console.log('🔄 Email lookup failed, trying Firebase UID...');
      
      // Get Firebase UID from profiles table
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', user_id)
        .single();

      if (profile) {
        console.log('🔄 Found Firebase UID, retrying with:', profile.id);
        const result = await supabaseAdmin
          .from('goals')
          .update({
            streak_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', goal_id)
          .eq('user_id', profile.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }
    }

    if (error) {
      console.error('❌ Error resetting streak:', error);
      throw error;
    }

    console.log('✅ Streak reset successfully for goal:', data.id);

    return new Response(JSON.stringify({ 
      success: true, 
      goal: data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in reset-streak function:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});