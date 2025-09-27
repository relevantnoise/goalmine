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
    console.log('[CHECK-DANLYNN] Checking complete status for danlynn@gmail.com');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    // Check all subscriber records for danlynn
    const { data: subscribersByEmail } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com');

    // If profile exists, also check by Firebase UID
    let subscribersById = null;
    if (profile?.id) {
      const { data } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', profile.id);
      subscribersById = data;
    }

    // Check goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, title, user_id, is_active')
      .eq('user_id', 'danlynn@gmail.com');

    // Today's email deliveries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayEmails } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('recipient_email', 'danlynn@gmail.com')
      .gte('created_at', todayStart.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        profile: profile,
        subscribersByEmail: subscribersByEmail,
        subscribersById: subscribersById,
        goals: goals,
        todayEmails: todayEmails,
        analysis: {
          profileExists: !!profile,
          hasSubscriberByEmail: subscribersByEmail?.length > 0,
          hasSubscriberById: subscribersById?.length > 0,
          isSubscribed: (subscribersByEmail?.some(s => s.subscribed === true)) || (subscribersById?.some(s => s.subscribed === true)),
          goalCount: goals?.length || 0,
          emailsToday: todayEmails?.length || 0
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[CHECK-DANLYNN] Error:', error);
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