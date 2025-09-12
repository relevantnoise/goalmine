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
    console.log('[TEST-EMAIL-FIX] Starting email fix test');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Step 1: Reset last_motivation_date for test users to yesterday
    console.log('[TEST-EMAIL-FIX] Step 1: Resetting last_motivation_date for test users');
    
    const { data: resetGoals, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: yesterday })
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com'])
      .select('*');
    
    if (resetError) {
      console.error('[TEST-EMAIL-FIX] Reset error:', resetError);
      throw resetError;
    }
    
    // Also reset Firebase UID-based goals
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('email', ['danlynn@gmail.com', 'dandlynn@yahoo.com']);
    
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.map(p => p.id);
      const { data: uidResetGoals } = await supabase
        .from('goals')
        .update({ last_motivation_date: yesterday })
        .in('user_id', profileIds)
        .select('*');
      
      console.log('[TEST-EMAIL-FIX] Reset Firebase UID goals:', uidResetGoals?.length);
    }
    
    console.log('[TEST-EMAIL-FIX] Reset email goals:', resetGoals?.length);
    
    // Step 2: Get all goals that should be eligible now
    const { data: eligibleGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .lte('last_motivation_date', yesterday);
    
    console.log('[TEST-EMAIL-FIX] Step 2: Goals eligible for processing:', eligibleGoals?.length);
    
    // Step 3: Test the hybrid profile lookup for each goal
    const testResults = [];
    
    for (const goal of eligibleGoals || []) {
      console.log(`[TEST-EMAIL-FIX] Testing goal: ${goal.title} (user_id: ${goal.user_id})`);
      
      let userProfile = null;
      let lookupMethod = '';
      
      if (goal.user_id.includes('@')) {
        // Email-based goal - lookup by email
        lookupMethod = 'email';
        const { data } = await supabase
          .from('profiles')
          .select('email, trial_expires_at, created_at')
          .eq('email', goal.user_id)
          .single();
        userProfile = data;
      } else {
        // Firebase UID-based goal - lookup by ID  
        lookupMethod = 'firebase_uid';
        const { data } = await supabase
          .from('profiles')
          .select('email, trial_expires_at, created_at')
          .eq('id', goal.user_id)
          .single();
        userProfile = data;
      }
      
      const profile = userProfile || { email: goal.user_id.includes('@') ? goal.user_id : null, trial_expires_at: null };
      
      const result = {
        goalId: goal.id,
        goalTitle: goal.title,
        userId: goal.user_id,
        lookupMethod,
        profileFound: !!userProfile,
        profileEmail: profile.email,
        validEmail: profile.email && profile.email.includes('@'),
        wouldSendEmail: profile.email && profile.email.includes('@')
      };
      
      testResults.push(result);
      console.log(`[TEST-EMAIL-FIX] Result:`, result);
    }
    
    // Step 4: Actually try to run the email function
    console.log('[TEST-EMAIL-FIX] Step 4: Running send-daily-emails with force delivery');
    
    const emailResponse = await supabase.functions.invoke('send-daily-emails', {
      body: { forceDelivery: true }
    });
    
    console.log('[TEST-EMAIL-FIX] Email function result:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        today,
        yesterday,
        eligibleGoals: eligibleGoals?.length || 0,
        testResults,
        emailFunctionResult: emailResponse.data,
        summary: {
          danlynnGmail: testResults.find(r => r.userId === 'danlynn@gmail.com'),
          dandlynnYahoo: testResults.find(r => r.profileEmail === 'dandlynn@yahoo.com')
        }
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-EMAIL-FIX] Error:', error);
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