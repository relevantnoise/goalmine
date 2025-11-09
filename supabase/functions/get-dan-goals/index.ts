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
    // Get all goals for danlynn@gmail.com using hybrid approach
    const { data: goalsByEmail } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .order('created_at', { ascending: false });

    // Get profile to find Firebase UID
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    let goalsByUID = [];
    if (profile?.id) {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      goalsByUID = data || [];
    }

    const result = {
      email: 'danlynn@gmail.com',
      profile: profile,
      goalsByEmail: goalsByEmail || [],
      goalsByUID: goalsByUID,
      totalGoals: (goalsByEmail?.length || 0) + goalsByUID.length,
      combinedGoals: [...(goalsByEmail || []), ...goalsByUID]
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);