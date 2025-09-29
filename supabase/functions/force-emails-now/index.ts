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
    console.log('[FORCE-EMAILS] EMERGENCY EMAIL DELIVERY - Resetting and sending immediately');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Reset email dates for both users
    console.log('[FORCE-EMAILS] Step 1: Resetting email processing dates');
    const { data: resetData, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .in('user_id', ['danlynn@gmail.com', 'dandlynn@yahoo.com'])
      .eq('is_active', true)
      .select('id, title, user_id, last_motivation_date');

    if (resetError) {
      console.error('[FORCE-EMAILS] Reset failed:', resetError);
      throw resetError;
    }

    console.log(`[FORCE-EMAILS] ✅ Reset ${resetData?.length || 0} goals:`, resetData);

    // Step 2: Force immediate email delivery
    console.log('[FORCE-EMAILS] Step 2: Forcing email delivery with bypass');
    const emailResponse = await supabase.functions.invoke('send-daily-emails', {
      body: { forceDelivery: true },
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });

    console.log('[FORCE-EMAILS] Email delivery response:', emailResponse);

    // Step 3: Check results
    const results = {
      resetCount: resetData?.length || 0,
      resetGoals: resetData,
      emailResponse: emailResponse.data,
      emailError: emailResponse.error,
      success: !emailResponse.error && emailResponse.data?.success
    };

    console.log('[FORCE-EMAILS] Final results:', results);

    return new Response(
      JSON.stringify({
        success: results.success,
        message: `FORCE DELIVERY: Reset ${results.resetCount} goals, Email result: ${results.success ? 'SUCCESS' : 'FAILED'}`,
        details: results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[FORCE-EMAILS] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Force email delivery failed'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);