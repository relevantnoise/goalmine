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
    console.log('[RESET-DANDLYNN] Resetting dandlynn@yahoo.com email date for testing');

    // Reset last_motivation_date for dandlynn@yahoo.com goal only
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('user_id', 'dandlynn@yahoo.com')
      .select()
      .single();

    if (goalError) {
      throw new Error(`Error resetting goal: ${goalError.message}`);
    }

    console.log('[RESET-DANDLYNN] Successfully reset email date for goal:', goal.title);

    // Now test sending email to this specific goal
    console.log('[RESET-DANDLYNN] Testing email send to dandlynn@yahoo.com');
    
    const emailResponse = await supabase.functions.invoke('send-motivation-email', {
      body: {
        email: 'dandlynn@yahoo.com',
        name: 'dandlynn',
        goal: goal.title,
        message: 'TEST: This is a test email to verify dandlynn@yahoo.com can receive emails',
        microPlan: 'Step 1: Check your inbox\nStep 2: Confirm you received this email\nStep 3: Let us know it worked',
        challenge: 'Check your email inbox right now and confirm you received this test email.',
        streak: goal.streak_count,
        redirectUrl: 'https://goalmine.ai',
        isNudge: false,
        userId: 'dandlynn@yahoo.com',
        goalId: goal.id
      }
    });

    const emailSuccess = !emailResponse.error;
    const emailError = emailResponse.error?.message || null;

    console.log('[RESET-DANDLYNN] Email test result:', { success: emailSuccess, error: emailError });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'dandlynn@yahoo.com goal reset and email test completed',
        goalReset: {
          id: goal.id,
          title: goal.title,
          last_motivation_date: goal.last_motivation_date
        },
        emailTest: {
          success: emailSuccess,
          error: emailError
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[RESET-DANDLYNN] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);