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
    console.log('[DEBUG-EMAIL-ISSUE] Starting investigation for danlynn@gmail.com');
    
    const email = 'danlynn@gmail.com';
    const todayUTC = new Date().toISOString().split('T')[0];
    
    // Check user's goals
    const { data: emailGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', email)
      .eq('is_active', true);
    
    // Check Firebase UID goals (get profile first)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    let firebaseGoals = [];
    if (profile) {
      const { data: fbGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true);
      firebaseGoals = fbGoals || [];
    }
    
    // Check for any framework-related goals
    const { data: frameworkGoals } = await supabase
      .from('goals')
      .select('*')
      .or(`user_id.eq.${email},user_id.eq.${profile?.id || 'none'}`)
      .ilike('title', '%assessment%');
    
    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', email)
      .single();
    
    const result = {
      timestamp: new Date().toISOString(),
      todayUTC,
      email,
      profile: profile || null,
      emailGoals: emailGoals || [],
      firebaseGoals: firebaseGoals || [],
      frameworkGoals: frameworkGoals || [],
      subscription: subscription || null,
      totalActiveGoals: (emailGoals?.length || 0) + (firebaseGoals?.length || 0),
      analysis: {
        shouldReceiveOneEmail: true,
        possibleDuplicateCauses: [
          'Both old send-daily-emails and new send-daily-wake-up-call running',
          'Framework goals still being treated as regular goals',
          'Multiple user ID formats causing double processing',
          'Assessment goals not properly filtered out'
        ]
      }
    };

    console.log('[DEBUG-EMAIL-ISSUE] Investigation complete:', result);

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-EMAIL-ISSUE] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);