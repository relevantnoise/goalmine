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
    console.log('[DEBUG] Starting email system debug');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    console.log('[DEBUG] Profiles:', profiles?.length, 'Error:', profilesError);
    if (profiles) {
      profiles.forEach(p => console.log('Profile:', p.id, p.email));
    }

    // Check active goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    console.log('[DEBUG] Active goals:', goals?.length, 'Error:', goalsError);
    if (goals) {
      goals.forEach(g => console.log('Goal:', g.id, g.title, 'User:', g.user_id));
    }

    // Check for danlynn@gmail.com specifically
    const { data: danlynn, error: danlynnError } = await supabase
      .from('goals')
      .select('*, profiles!inner(email)')
      .eq('is_active', true)
      .eq('profiles.email', 'danlynn@gmail.com');

    console.log('[DEBUG] danlynn@gmail.com goals:', danlynn?.length, 'Error:', danlynnError);

    return new Response(
      JSON.stringify({ 
        profiles: profiles?.length || 0,
        goals: goals?.length || 0,
        danlynnGoals: danlynn?.length || 0,
        debug: 'Check logs for details'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
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