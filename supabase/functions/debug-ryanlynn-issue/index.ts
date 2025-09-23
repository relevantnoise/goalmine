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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[DEBUG-RYANLYNN] Starting investigation...');

    // Check profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .or('email.eq.ryanlynn@umich.edu,id.eq.ryanlynn@umich.edu');

    console.log('[DEBUG-RYANLYNN] Profile data:', profiles);
    console.log('[DEBUG-RYANLYNN] Profile error:', profileError);

    // Check goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or('user_id.eq.ryanlynn@umich.edu')
      .order('created_at', { ascending: false });

    console.log('[DEBUG-RYANLYNN] Goals data:', goals);
    console.log('[DEBUG-RYANLYNN] Goals error:', goalsError);

    // Check subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', 'ryanlynn@umich.edu');

    console.log('[DEBUG-RYANLYNN] Subscribers data:', subscribers);
    console.log('[DEBUG-RYANLYNN] Subscribers error:', subscribersError);

    // Check motivation history for today
    const today = new Date().toISOString().split('T')[0];
    const { data: motivationHistory, error: motivationError } = await supabase
      .from('motivation_history')
      .select('*')
      .or('user_id.eq.ryanlynn@umich.edu')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    console.log('[DEBUG-RYANLYNN] Today\'s motivation history:', motivationHistory);
    console.log('[DEBUG-RYANLYNN] Motivation error:', motivationError);

    // Check email deliveries for today
    const { data: emailDeliveries, error: emailError } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('recipient_email', 'ryanlynn@umich.edu')
      .gte('sent_at', `${today}T00:00:00`)
      .order('sent_at', { ascending: false });

    console.log('[DEBUG-RYANLYNN] Today\'s email deliveries:', emailDeliveries);
    console.log('[DEBUG-RYANLYNN] Email deliveries error:', emailError);

    // Check if there are any Firebase UID-based goals
    const firebaseUID = profiles?.[0]?.id;
    if (firebaseUID && firebaseUID !== 'ryanlynn@umich.edu') {
      const { data: firebaseGoals, error: firebaseGoalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', firebaseUID)
        .order('created_at', { ascending: false });

      console.log('[DEBUG-RYANLYNN] Firebase UID-based goals:', firebaseGoals);
      console.log('[DEBUG-RYANLYNN] Firebase UID goals error:', firebaseGoalsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          profiles: profiles || [],
          goals: goals || [],
          subscribers: subscribers || [],
          motivationHistory: motivationHistory || [],
          emailDeliveries: emailDeliveries || [],
          firebaseUID: firebaseUID,
          investigation: 'Completed'
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-RYANLYNN] Error:', error);
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