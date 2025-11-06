import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalId, userId } = await req.json();

    console.log('🔍 DEBUG: Testing check-in date calculation logic');
    console.log('🔍 Input:', { goalId, userId });

    // EXACT SAME LOGIC as check-in function - let's see what's happening
    const now = new Date();
    
    // Calculate current streak date consistently using UTC-based approach
    // Convert to Eastern Time and subtract 3 hours for 3 AM reset
    const utcTime = now.getTime();
    const easternOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" }).includes('EDT') ? -4 : -5; // EDT vs EST
    const easternTime = new Date(utcTime + (easternOffset * 60 * 60 * 1000));
    const streakResetTime = new Date(easternTime.getTime() - (3 * 60 * 60 * 1000));
    const currentStreakDate = streakResetTime.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('🕐 DEBUG: Timezone calculation:', {
      utcTime: now.toISOString(),
      easternOffset,
      easternTime: easternTime.toISOString(),
      streakResetTime: streakResetTime.toISOString(),
      currentStreakDate,
      note: 'This should be consistent between calls'
    });

    // Test what time zone detection returns
    const easternString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const isDST = easternString.includes('EDT');
    
    console.log('🌍 DEBUG: Timezone detection:', {
      easternString,
      isDST,
      detectedOffset: isDST ? -4 : -5,
      expectation: 'Should be consistent for same day'
    });

    return new Response(JSON.stringify({ 
      success: true,
      debug: {
        utcTime: now.toISOString(),
        easternOffset,
        easternTime: easternTime.toISOString(),
        streakResetTime: streakResetTime.toISOString(),
        currentStreakDate,
        easternString,
        isDST,
        message: 'Check if currentStreakDate is consistent between calls'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});