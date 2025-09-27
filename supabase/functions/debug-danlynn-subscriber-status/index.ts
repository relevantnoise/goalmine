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
    console.log('[DEBUG-DANLYNN-SUB] Checking subscriber status and email delivery for danlynn@gmail.com');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'danlynn@gmail.com')
      .single();

    console.log('[DEBUG] Profile found:', profile);

    // Check subscriber status
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .single();

    console.log('[DEBUG] Subscriber record:', subscriber);

    // Check all email deliveries for today
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const { data: todayEmails } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('recipient_email', 'danlynn@gmail.com')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });

    console.log('[DEBUG] Today\'s emails:', todayEmails?.length || 0);

    // Calculate trial days
    let trialInfo = null;
    if (profile?.trial_expires_at) {
      const trialExpires = new Date(profile.trial_expires_at);
      const daysRemaining = Math.ceil((trialExpires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      trialInfo = {
        expires_at: profile.trial_expires_at,
        daysRemaining,
        isExpired: daysRemaining <= 0
      };
    }

    // Check if user should be excluded from trial warnings
    const shouldBeExcluded = subscriber && subscriber.subscribed === true;

    return new Response(
      JSON.stringify({
        success: true,
        today: todayStr,
        profile: {
          email: profile?.email,
          trial_expires_at: profile?.trial_expires_at,
          created_at: profile?.created_at
        },
        subscriber: {
          exists: !!subscriber,
          subscribed: subscriber?.subscribed,
          plan_name: subscriber?.plan_name,
          status: subscriber?.status
        },
        trialInfo,
        shouldBeExcludedFromTrialWarnings: shouldBeExcluded,
        todayEmails: todayEmails?.map(email => ({
          id: email.id,
          email_type: email.email_type,
          subject: email.subject,
          status: email.status,
          created_at: email.created_at,
          sent_at: email.sent_at
        })) || [],
        analysis: {
          duplicateEmails: (todayEmails?.filter(e => e.email_type?.includes('trial_warning')) || []).length > 1,
          shouldReceiveTrialWarnings: !shouldBeExcluded && trialInfo && trialInfo.daysRemaining > 0 && trialInfo.daysRemaining <= 7
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-DANLYNN-SUB] Error:', error);
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