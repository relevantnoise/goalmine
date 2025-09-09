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

    // Get all profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    
    // Get all active goals
    const { data: goals } = await supabase.from('goals').select('*').eq('is_active', true);

    console.log('=== PROFILES ===');
    profiles?.forEach(p => console.log(`ID: ${p.id}, Email: ${p.email}`));

    console.log('=== ACTIVE GOALS ===');
    goals?.forEach(g => console.log(`Goal: ${g.title}, User: ${g.user_id}`));

    // Find danlynn specifically
    const danlynnProfile = profiles?.find(p => p.email === 'danlynn@gmail.com');
    const danlynnGoals = goals?.filter(g => g.user_id === danlynnProfile?.id);

    console.log('=== DANLYNN MATCH ===');
    console.log(`Profile: ${danlynnProfile?.id}, Goals: ${danlynnGoals?.length}`);

    return new Response(JSON.stringify({
      profiles: profiles?.map(p => ({ id: p.id, email: p.email })),
      goals: goals?.map(g => ({ title: g.title, user_id: g.user_id })),
      danlynnProfileId: danlynnProfile?.id,
      danlynnGoalsCount: danlynnGoals?.length
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