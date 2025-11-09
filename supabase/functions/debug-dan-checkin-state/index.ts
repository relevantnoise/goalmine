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
    console.log('[DEBUG-DAN-CHECKIN] Starting debug investigation for danlynn@gmail.com');
    
    const userEmail = 'danlynn@gmail.com';
    
    // Get all goals for danlynn
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userEmail)
      .eq('is_active', true);

    if (goalsError) {
      console.error('❌ Error fetching goals:', goalsError);
      throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    }

    console.log(`📊 Found ${goals?.length || 0} active goals for ${userEmail}`);

    // Calculate current streak date using EXACT SAME LOGIC as frontend and backend
    const now = new Date();
    console.log('🕐 Current time (raw):', now.toISOString());
    console.log('🕐 Current time (EST):', now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5;
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0];
    
    console.log('🧮 UTC time:', utcTime);
    console.log('🧮 Eastern offset:', easternOffset);
    console.log('🧮 Eastern time:', easternTime.toISOString());
    console.log('🧮 Streak reset time:', streakResetTime.toISOString());
    console.log('🧮 Current streak date:', currentStreakDate);

    const debugInfo = {
      userEmail,
      currentTime: now.toISOString(),
      easternTime: easternTime.toISOString(),
      currentStreakDate,
      easternOffset,
      goals: goals?.map(goal => ({
        id: goal.id,
        title: goal.title,
        last_checkin_date: goal.last_checkin_date,
        streak_count: goal.streak_count,
        updated_at: goal.updated_at,
        // Calculate if checked in today for each goal
        hasCheckedInToday: (() => {
          if (!goal.last_checkin_date) return false;
          
          let lastCheckinStreakDate = '';
          if (goal.last_checkin_date.length === 10) {
            // Date string format "2025-11-06" - use directly
            lastCheckinStreakDate = goal.last_checkin_date;
          } else {
            // Full timestamp format - apply timezone calculation
            const lastCheckinTime = new Date(goal.last_checkin_date);
            const lastUtcTime = lastCheckinTime.getTime();
            const lastEasternTime = new Date(lastUtcTime + (easternOffset * 60 * 60 * 1000));
            const lastStreakResetTime = new Date(lastEasternTime.getTime() - (3 * 60 * 60 * 1000));
            lastCheckinStreakDate = lastStreakResetTime.toISOString().split('T')[0];
          }
          
          const result = currentStreakDate === lastCheckinStreakDate;
          console.log(`🎯 Goal "${goal.title}": last_checkin_date=${goal.last_checkin_date}, lastCheckinStreakDate=${lastCheckinStreakDate}, hasCheckedInToday=${result}`);
          return result;
        })()
      }))
    };

    console.log('[DEBUG-DAN-CHECKIN] Debug info:', JSON.stringify(debugInfo, null, 2));

    return new Response(JSON.stringify({
      success: true,
      debugInfo
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[DEBUG-DAN-CHECKIN] Error:', error);
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