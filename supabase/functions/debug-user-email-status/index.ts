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
    console.log('[DEBUG-USER-EMAIL] Starting user email status check');
    
    const { userId } = req.method === 'POST' ? await req.json() : { userId: 'dandlynn@yahoo.com' };
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    console.log(`[DEBUG-USER-EMAIL] Checking status for ${userId} on ${today}`);
    
    // 1. Check profiles for this user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userId);
    
    console.log(`[DEBUG-USER-EMAIL] Profiles found: ${profiles?.length}`);
    profiles?.forEach((p, i) => {
      console.log(`[DEBUG-USER-EMAIL] Profile ${i+1}: ID=${p.id}, Email=${p.email}, Trial_Expires=${p.trial_expires_at}`);
    });

    // 2. Check goals for this user (hybrid approach)
    const { data: emailGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
      
    console.log(`[DEBUG-USER-EMAIL] Email-based active goals: ${emailGoals?.length}`);
    emailGoals?.forEach((g, i) => {
      console.log(`[DEBUG-USER-EMAIL] Email Goal ${i+1}: ID=${g.id}, Title="${g.title}", Last_Motivation=${g.last_motivation_date}, Target=${g.target_date}`);
    });

    // Check Firebase UID-based goals
    const firebaseUidGoals = [];
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const { data: uidGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true);
        if (uidGoals && uidGoals.length > 0) {
          firebaseUidGoals.push(...uidGoals);
        }
      }
    }
    
    console.log(`[DEBUG-USER-EMAIL] Firebase UID-based active goals: ${firebaseUidGoals.length}`);
    firebaseUidGoals?.forEach((g, i) => {
      console.log(`[DEBUG-USER-EMAIL] UID Goal ${i+1}: ID=${g.id}, Title="${g.title}", Last_Motivation=${g.last_motivation_date}, Target=${g.target_date}`);
    });

    const allGoals = [...(emailGoals || []), ...firebaseUidGoals];
    
    // 3. Check subscription status
    const { data: subscription } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId);
    
    console.log(`[DEBUG-USER-EMAIL] Subscription status:`, subscription?.[0]);

    // 4. Check if goals are eligible for today's processing
    const eligibleGoals = allGoals.filter(g => {
      const lastMotivationDate = g.last_motivation_date;
      const targetDate = new Date(g.target_date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      // Goal is eligible if:
      // - last_motivation_date is null OR less than today
      // - target_date is not expired (>= today)
      // - is_active is true (already filtered)
      
      const isEligible = (!lastMotivationDate || lastMotivationDate < today) && 
                        (targetDate >= todayDate);
      
      console.log(`[DEBUG-USER-EMAIL] Goal "${g.title}": Last_Motivation=${lastMotivationDate}, Target=${g.target_date}, Eligible=${isEligible}`);
      return isEligible;
    });

    // 5. Check trial status
    let trialExpired = false;
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      if (profile.trial_expires_at) {
        trialExpired = new Date(profile.trial_expires_at) < new Date();
      }
    }

    const isSubscribed = subscription && subscription.length > 0 && subscription[0].subscribed === true;
    
    // 6. Simulate skip logic
    const emailsWouldSend = [];
    for (const goal of eligibleGoals) {
      // Check if trial expired and not subscribed
      if (trialExpired && !isSubscribed) {
        console.log(`[DEBUG-USER-EMAIL] Would skip goal "${goal.title}": Trial expired and not subscribed`);
        continue;
      }
      
      // Check if goal is expired
      const targetDate = new Date(goal.target_date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (targetDate < todayDate) {
        console.log(`[DEBUG-USER-EMAIL] Would skip goal "${goal.title}": Goal expired (target date passed)`);
        continue;
      }
      
      emailsWouldSend.push(goal);
      console.log(`[DEBUG-USER-EMAIL] Would send email for goal "${goal.title}"`);
    }

    const analysis = {
      userId,
      date: today,
      profiles: profiles?.length || 0,
      totalActiveGoals: allGoals.length,
      emailGoals: emailGoals?.length || 0,
      uidGoals: firebaseUidGoals.length,
      eligibleGoals: eligibleGoals.length,
      emailsWouldSend: emailsWouldSend.length,
      subscription: {
        exists: !!subscription?.[0],
        subscribed: isSubscribed,
        details: subscription?.[0]
      },
      trial: {
        expired: trialExpired,
        expiresAt: profiles?.[0]?.trial_expires_at
      },
      goalDetails: allGoals.map(g => ({
        id: g.id,
        title: g.title,
        userIdFormat: g.user_id.includes('@') ? 'email' : 'firebase_uid',
        lastMotivationDate: g.last_motivation_date,
        targetDate: g.target_date,
        isActive: g.is_active,
        eligible: eligibleGoals.some(eg => eg.id === g.id),
        wouldSendEmail: emailsWouldSend.some(eg => eg.id === g.id)
      }))
    };

    console.log(`[DEBUG-USER-EMAIL] Analysis complete:`, analysis);

    return new Response(
      JSON.stringify(analysis, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DEBUG-USER-EMAIL] Error:', error);
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