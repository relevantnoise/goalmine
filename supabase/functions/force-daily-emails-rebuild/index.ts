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
    console.log('[FORCE-REBUILD] 🚀 MANUAL TRIGGER - Force sending daily emails NOW');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset last_motivation_date for all goals to force resend
    const { data: resetGoals, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .select();

    if (resetError) {
      console.error('[FORCE-REBUILD] ❌ Error resetting goals:', resetError);
    } else {
      console.log(`[FORCE-REBUILD] ✅ Reset ${resetGoals?.length || 0} goals for fresh send`);
    }

    // Now trigger the email function
    console.log('[FORCE-REBUILD] 📧 Triggering send-daily-emails-simple-rebuild...');
    
    const emailResponse = await supabase.functions.invoke('send-daily-emails-simple-rebuild', {
      body: {}
    });

    console.log('[FORCE-REBUILD] 📬 Email response:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Force email send completed',
      resetGoals: resetGoals?.length || 0,
      emailResponse: emailResponse.data,
      emailError: emailResponse.error,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[FORCE-REBUILD] ❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);