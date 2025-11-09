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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 RESET: Clearing today\'s check-ins for danlynn@gmail.com');
    
    // Reset check-ins for goals that were checked in today (2025-11-08 or 2025-11-09)
    const { data: updatedGoals, error } = await supabase
      .from('goals')
      .update({
        last_checkin_date: null  // Clear today's check-ins
      })
      .eq('user_id', 'RiFfHnPjmVfCcxNJ2pwJSB5LLDG2')  // Firebase UID
      .in('last_checkin_date', ['2025-11-08', '2025-11-09'])
      .select();

    if (error) {
      console.error('❌ Reset error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('✅ Reset completed:', updatedGoals);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Reset ${updatedGoals?.length || 0} goals`,
      resetGoals: updatedGoals
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('❌ Reset function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});