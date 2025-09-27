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
    console.log('[TEST-ATOMIC] Testing atomic behavior');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check current goal status
    const { data: goals, error: goalError } = await supabase
      .from('goals')
      .select('id, title, last_motivation_date, is_active, user_id')
      .eq('is_active', true)
      .limit(3);

    if (goalError) {
      throw goalError;
    }

    console.log('[TEST-ATOMIC] Current goals:', goals);

    // Test 1: Simulate what happens when two functions try to process the same goal
    if (goals && goals.length > 0) {
      const testGoal = goals[0];
      console.log(`[TEST-ATOMIC] Testing with goal: ${testGoal.title} (${testGoal.id})`);

      // Reset the goal to yesterday to simulate it needing processing
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { error: resetError } = await supabase
        .from('goals')
        .update({ last_motivation_date: yesterdayStr })
        .eq('id', testGoal.id);

      if (resetError) {
        throw resetError;
      }

      console.log(`[TEST-ATOMIC] Reset goal ${testGoal.id} to need processing (last_motivation_date: ${yesterdayStr})`);

      // Now test the atomic claiming behavior
      const today = new Date().toISOString().split('T')[0];
      
      // Simulate two concurrent attempts to claim the same goal
      const promises = [1, 2].map(async (attempt) => {
        try {
          console.log(`[TEST-ATOMIC] Attempt ${attempt}: Trying to claim goal ${testGoal.id}`);
          
          const { data: claimed, error: claimError } = await supabase
            .from('goals')
            .update({ last_motivation_date: today })
            .eq('id', testGoal.id)
            .eq('is_active', true)
            .or(`last_motivation_date.is.null,last_motivation_date.lt.${today}`)
            .select('*');

          if (claimError) {
            return { attempt, success: false, error: claimError.message };
          }

          if (claimed && claimed.length > 0) {
            return { attempt, success: true, claimed: claimed[0], message: 'Successfully claimed goal' };
          } else {
            return { attempt, success: true, claimed: null, message: 'Goal already claimed by another process' };
          }
        } catch (error: any) {
          return { attempt, success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      console.log('[TEST-ATOMIC] Concurrent claim results:', results);

      // Count how many actually succeeded in claiming
      const successful = results.filter(r => r.success && r.claimed);
      const alreadyClaimed = results.filter(r => r.success && !r.claimed);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Atomic behavior test completed',
          testGoal: {
            id: testGoal.id,
            title: testGoal.title
          },
          results: {
            totalAttempts: 2,
            successfulClaims: successful.length,
            alreadyClaimedResponses: alreadyClaimed.length,
            details: results
          },
          analysis: {
            atomicBehaviorWorking: successful.length === 1 && alreadyClaimed.length === 1,
            explanation: successful.length === 1 ? 
              'Perfect! Only one attempt succeeded in claiming the goal, the other got rejected' :
              `Problem! ${successful.length} attempts succeeded when only 1 should have`
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'No active goals found to test with',
        goals: goals
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-ATOMIC] Error:', error);
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