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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    );

    const userEmail = "danlynn@gmail.com";

    // Check subscription
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userEmail)
      .single();

    // Check profile  
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    // Check goals by email
    const { data: goalsByEmail, error: goalsEmailError } = await supabase
      .from('goals')
      .select('id, title, created_at')
      .eq('user_id', userEmail);

    // Check goals by Firebase UID
    const { data: goalsByUID, error: goalsUIDError } = await supabase
      .from('goals')
      .select('id, title, created_at')
      .eq('user_id', profile?.id || 'no-profile');

    return new Response(JSON.stringify({
      subscriber,
      subError,
      profile,
      profileError,
      goalsByEmail,
      goalsEmailError,
      goalsByUID,
      goalsUIDError,
      combinedGoalCount: [...(goalsByEmail || []), ...(goalsByUID || [])].length
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});