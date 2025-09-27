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
    console.log('[TEST-DUPLICATES] Testing duplicate email prevention');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reset one goal to yesterday so it needs processing
    const { data: goals, error: goalError } = await supabase
      .from('goals')
      .select('id, title, last_motivation_date, user_id')
      .eq('is_active', true)
      .limit(1);

    if (goalError || !goals || goals.length === 0) {
      throw new Error('No goals found for testing');
    }

    const testGoal = goals[0];
    console.log(`[TEST-DUPLICATES] Using goal: ${testGoal.title} (${testGoal.id})`);

    // Reset to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await supabase
      .from('goals')
      .update({ last_motivation_date: yesterdayStr })
      .eq('id', testGoal.id);

    console.log(`[TEST-DUPLICATES] Reset goal to need processing (date: ${yesterdayStr})`);

    // Now simulate what would happen if two cron jobs ran simultaneously
    const promises = [1, 2].map(async (callNumber) => {
      try {
        console.log(`[TEST-DUPLICATES] Simulating email call ${callNumber}`);
        
        const response = await fetch(
          'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ forceDelivery: true })
          }
        );

        const data = await response.json();
        return {
          callNumber,
          success: response.ok,
          data: data,
          emailsSent: data.emailsSent || 0
        };
      } catch (error: any) {
        return {
          callNumber,
          success: false,
          error: error.message
        };
      }
    });

    console.log('[TEST-DUPLICATES] Running concurrent email functions...');
    const results = await Promise.all(promises);
    
    // Calculate total emails sent
    const totalEmailsSent = results.reduce((sum, result) => {
      return sum + (result.emailsSent || 0);
    }, 0);

    const successfulCalls = results.filter(r => r.success).length;
    
    console.log('[TEST-DUPLICATES] Results:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Duplicate prevention test completed',
        testGoal: {
          id: testGoal.id,
          title: testGoal.title,
          resetTo: yesterdayStr
        },
        results: {
          totalConcurrentCalls: 2,
          successfulCalls: successfulCalls,
          totalEmailsSent: totalEmailsSent,
          callDetails: results
        },
        analysis: {
          duplicatesPrevented: totalEmailsSent <= 1,
          explanation: totalEmailsSent <= 1 ? 
            `✅ SUCCESS: Only ${totalEmailsSent} email(s) sent total - duplicates prevented!` :
            `❌ PROBLEM: ${totalEmailsSent} emails sent - duplicates NOT prevented!`
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-DUPLICATES] Error:', error);
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