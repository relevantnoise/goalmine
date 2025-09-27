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
    console.log('[DEBUG-DANLYNN] Checking trial and goal status for danlynn@gmail.com');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check profile and trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    // Check goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .eq('is_active', true);

    // Check email deliveries in last 24 hours
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentEmails } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('recipient_email', 'danlynn@gmail.com')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    // Calculate days for each goal
    const goalAnalysis = goals?.map(goal => {
      const targetDate = new Date(goal.target_date);
      const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: goal.id,
        title: goal.title,
        target_date: goal.target_date,
        daysUntilTarget,
        isExpiringSoon: daysUntilTarget <= 7 && daysUntilTarget > 0
      };
    });

    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (profile?.trial_expires_at) {
      const trialExpires = new Date(profile.trial_expires_at);
      trialDaysRemaining = Math.ceil((trialExpires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return new Response(
      JSON.stringify({
        success: true,
        today: todayStr,
        profile: {
          email: profile?.email,
          trial_expires_at: profile?.trial_expires_at,
          trialDaysRemaining
        },
        goals: goalAnalysis,
        recentEmails: recentEmails?.map(email => ({
          email_type: email.email_type,
          subject: email.subject,
          created_at: email.created_at,
          status: email.status
        }))
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-DANLYNN] Error:', error);
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