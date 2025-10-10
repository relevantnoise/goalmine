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
    console.log('🔍 [DEBUG-AI-FAILURE] Starting investigation of AI content generation failure');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: any = {
      timestamp: new Date().toISOString(),
      investigation: "AI Content Generation Failure Analysis"
    };

    // 1. Get both users' goals for comparison
    console.log('🔍 Fetching goals for both users...');
    
    const { data: danlynnGoals, error: danlynnError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'danlynn@gmail.com')
      .eq('is_active', true);
    
    const { data: dandlynnGoals, error: dandlynnError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', 'dandlynn@yahoo.com')  
      .eq('is_active', true);

    results.danlynn_goals = {
      count: danlynnGoals?.length || 0,
      goals: danlynnGoals,
      error: danlynnError
    };

    results.dandlynn_goals = {
      count: dandlynnGoals?.length || 0,
      goals: dandlynnGoals,
      error: dandlynnError
    };

    // 2. Check for hybrid architecture goals (Firebase UID format)
    console.log('🔍 Checking for Firebase UID goals...');
    
    // Get profile for danlynn@gmail.com to find Firebase UID
    const { data: danlynnProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'danlynn@gmail.com');

    if (danlynnProfile && danlynnProfile.length > 0) {
      const firebaseUID = danlynnProfile[0].id;
      console.log('🔍 Found Firebase UID for danlynn:', firebaseUID);
      
      const { data: firebaseGoals, error: firebaseError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', firebaseUID)
        .eq('is_active', true);

      results.danlynn_firebase_goals = {
        firebase_uid: firebaseUID,
        count: firebaseGoals?.length || 0,
        goals: firebaseGoals,
        error: firebaseError
      };
    }

    // 3. Check recent goal edits/updates
    console.log('🔍 Checking recent goal updates...');
    
    const { data: recentUpdates } = await supabase
      .from('goals')
      .select('id, title, updated_at, user_id')
      .or('user_id.eq.danlynn@gmail.com,user_id.eq.dandlynn@yahoo.com')
      .gte('updated_at', '2025-10-09T00:00:00.000Z') // Yesterday
      .order('updated_at', { ascending: false });

    results.recent_updates = recentUpdates;

    // 4. Check today's email processing status
    console.log('🔍 Checking today\'s email processing...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todaysGoals } = await supabase
      .from('goals')
      .select('id, title, user_id, last_motivation_date, tone, streak_count')
      .eq('is_active', true)
      .eq('last_motivation_date', today);

    results.todays_processed_goals = {
      date: today,
      goals: todaysGoals
    };

    // 5. Check motivation history for today
    console.log('🔍 Checking motivation history...');
    
    const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
    const todayEnd = new Date(today + 'T23:59:59.999Z').toISOString();
    
    const { data: motivationHistory } = await supabase
      .from('motivation_history')
      .select('goal_id, message, micro_plan, challenge, created_at')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .order('created_at', { ascending: false });

    results.todays_motivation_history = motivationHistory;

    // 6. Data integrity checks
    console.log('🔍 Performing data integrity checks...');
    
    const allGoals = [...(danlynnGoals || []), ...(dandlynnGoals || [])];
    const integrityIssues = [];

    for (const goal of allGoals) {
      const issues = [];
      
      if (!goal.title || goal.title.trim() === '') issues.push('empty_title');
      if (!goal.tone) issues.push('missing_tone');
      if (goal.title && (goal.title.includes('"') || goal.title.includes("'"))) issues.push('quotes_in_title');
      if (goal.description && (goal.description.includes('"') || goal.description.includes("'"))) issues.push('quotes_in_description');
      if (goal.title && goal.title.length > 200) issues.push('title_too_long');
      
      if (issues.length > 0) {
        integrityIssues.push({
          goal_id: goal.id,
          user_id: goal.user_id,
          title: goal.title,
          issues: issues
        });
      }
    }

    results.data_integrity_issues = integrityIssues;

    // 7. Summary analysis
    results.analysis_summary = {
      danlynn_total_goals: (danlynnGoals?.length || 0) + (results.danlynn_firebase_goals?.count || 0),
      dandlynn_total_goals: dandlynnGoals?.length || 0,
      recent_edits_count: recentUpdates?.length || 0,
      integrity_issues_found: integrityIssues.length,
      processed_today: todaysGoals?.length || 0,
      motivation_generated_today: motivationHistory?.length || 0
    };

    console.log('✅ [DEBUG-AI-FAILURE] Investigation complete');

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [DEBUG-AI-FAILURE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);