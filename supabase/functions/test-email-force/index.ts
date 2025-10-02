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
    console.log('[TEST-EMAIL-FORCE] Starting forced email test - IGNORE PROCESSED STATE');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find ALL active goals, regardless of processed state
    const { data: allGoals, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .limit(3); // Limit for testing

    if (goalError) {
      console.error('[TEST-EMAIL-FORCE] Error fetching goals:', goalError);
      throw goalError;
    }

    console.log(`[TEST-EMAIL-FORCE] Found ${allGoals?.length || 0} active goals for forced test`);
    
    if (!allGoals || allGoals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No active goals found in the system',
          emailsSent: 0,
          errors: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailsSent = 0;
    let errors = 0;
    const results = [];

    // Process each goal REGARDLESS of last_motivation_date
    for (const goal of allGoals) {
      try {
        console.log(`[TEST-EMAIL-FORCE] FORCE Processing: "${goal.title}"`);
        
        // Get profile info for email
        let profile;
        if (goal.user_id.includes('@')) {
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at')
            .eq('email', goal.user_id)
            .single();
          profile = result.data || { email: goal.user_id, trial_expires_at: null };
        } else {
          const result = await supabase
            .from('profiles')
            .select('email, trial_expires_at')
            .eq('id', goal.user_id)
            .single();
          profile = result.data;
        }
        
        if (!profile?.email) {
          console.error(`[TEST-EMAIL-FORCE] No email for goal: ${goal.title}`);
          errors++;
          results.push({ goal: goal.title, status: 'error', reason: 'No email found' });
          continue;
        }

        console.log(`[TEST-EMAIL-FORCE] Sending test email to: ${profile.email}`);
        
        // Send email directly
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: profile.email,
            name: profile.email.split('@')[0],
            goal: goal.title,
            message: `🧪 TEST EMAIL: This is a test to verify the email system is working for your goal: ${goal.title}. If you receive this, the fix is working!`,
            microPlan: '• Check your email\n• Confirm you received this test\n• Celebrate that emails are working!',
            challenge: 'Reply to confirm you got this test email!',
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          }
        });

        // Check result
        if (emailResponse.error || !emailResponse.data?.success) {
          const errorMsg = emailResponse.error?.message || emailResponse.data?.error || 'Email delivery failed';
          console.error(`[TEST-EMAIL-FORCE] ❌ Test email failed for ${goal.title}:`, errorMsg);
          errors++;
          results.push({ goal: goal.title, status: 'error', reason: errorMsg, email: profile.email });
        } else {
          console.log(`[TEST-EMAIL-FORCE] ✅ Test email sent for ${goal.title}:`, emailResponse.data);
          emailsSent++;
          results.push({ goal: goal.title, status: 'sent', email: profile.email, resendId: emailResponse.data.id });
        }

      } catch (error) {
        console.error(`[TEST-EMAIL-FORCE] Error processing ${goal.title}:`, error);
        errors++;
        results.push({ goal: goal.title, status: 'error', reason: error.message });
      }
    }

    console.log(`[TEST-EMAIL-FORCE] Complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: emailsSent > 0,
        emailsSent, 
        errors,
        results,
        message: `FORCED email test completed. Sent ${emailsSent} test emails with ${errors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[TEST-EMAIL-FORCE] Fatal error:', error);
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