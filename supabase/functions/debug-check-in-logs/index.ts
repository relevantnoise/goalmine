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
    console.log('[DEBUG-LOGS] Checking recent check-in function activity...');
    
    // Check for recent goals with danlynn@gmail.com or dandlynn@yahoo.com
    const { data: danGoals, error: danError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .order('updated_at', { ascending: false });

    const { data: dandGoals, error: dandError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'dandlynn@yahoo.com')
      .order('updated_at', { ascending: false });

    // Check profile lookup for Firebase UID approach
    const { data: danProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    const { data: dandProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'dandlynn@yahoo.com')
      .single();

    console.log('[DEBUG-LOGS] Dan profile:', danProfile);
    console.log('[DEBUG-LOGS] Dand profile:', dandProfile);

    // If we have Firebase UIDs, check goals with those too
    let danFirebaseGoals = [];
    let dandFirebaseGoals = [];
    
    if (danProfile?.id) {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', danProfile.id)
        .order('updated_at', { ascending: false });
      danFirebaseGoals = data || [];
    }
    
    if (dandProfile?.id) {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', dandProfile.id)
        .order('updated_at', { ascending: false });
      dandFirebaseGoals = data || [];
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      danlynn: {
        email: 'danlynn@gmail.com',
        profile: danProfile,
        goalsByEmail: danGoals?.length || 0,
        goalsByFirebaseUID: danFirebaseGoals.length,
        recentGoals: (danGoals || []).concat(danFirebaseGoals).map(g => ({
          id: g.id,
          title: g.title,
          user_id: g.user_id,
          last_checkin_date: g.last_checkin_date,
          streak_count: g.streak_count,
          updated_at: g.updated_at
        }))
      },
      dandlynn: {
        email: 'dandlynn@yahoo.com', 
        profile: dandProfile,
        goalsByEmail: dandGoals?.length || 0,
        goalsByFirebaseUID: dandFirebaseGoals.length,
        recentGoals: (dandGoals || []).concat(dandFirebaseGoals).map(g => ({
          id: g.id,
          title: g.title,
          user_id: g.user_id,
          last_checkin_date: g.last_checkin_date,
          streak_count: g.streak_count,
          updated_at: g.updated_at
        }))
      }
    };

    console.log('[DEBUG-LOGS] Complete analysis:', JSON.stringify(debugInfo, null, 2));

    return new Response(JSON.stringify({
      success: true,
      debugInfo
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-LOGS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);