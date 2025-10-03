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
    console.log('[DEBUG-HIJACKED] 🚀 HIJACKED FUNCTION - SENDING EMAILS NOW');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // NUCLEAR: Reset all goals and send emails RIGHT NOW
    const todayUTC = new Date().toISOString().split('T')[0];
    console.log('[DEBUG-HIJACKED] Today UTC:', todayUTC);

    // Reset ALL goals
    console.log('[DEBUG-HIJACKED] Resetting ALL goals...');
    const { data: resetGoals, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .select();

    if (resetError) {
      console.error('[DEBUG-HIJACKED] Reset error:', resetError);
      return new Response(JSON.stringify({ error: resetError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[DEBUG-HIJACKED] Reset ${resetGoals?.length || 0} goals`);

    // Get ALL active goals
    const { data: activeGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[DEBUG-HIJACKED] Goals error:', goalsError);
      return new Response(JSON.stringify({ error: goalsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[DEBUG-HIJACKED] Found ${activeGoals?.length || 0} active goals`);

    let emailsSent = 0;
    let errors = 0;
    const results = [];

    if (activeGoals && activeGoals.length > 0) {
      for (const goal of activeGoals) {
        try {
          console.log(`[DEBUG-HIJACKED] Processing: "${goal.title}" for ${goal.user_id}`);

          // Get email
          let email = goal.user_id;
          if (!email.includes('@')) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', goal.user_id)
              .single();
            email = profile?.email;
          }

          if (!email) {
            console.error(`[DEBUG-HIJACKED] No email for: ${goal.title}`);
            results.push({ goal: goal.title, status: 'No email found' });
            errors++;
            continue;
          }

          console.log(`[DEBUG-HIJACKED] Sending to: ${email}`);

          // Send email via existing function
          const emailResponse = await supabase.functions.invoke('send-motivation-email', {
            body: {
              email: email,
              name: email.split('@')[0],
              goal: goal.title,
              message: `🎯 MANUAL TEST: Daily motivation for "${goal.title}". Today is your day to make progress!`,
              microPlan: ['Take one step forward', 'Track your progress', 'Celebrate small wins'],
              challenge: 'Spend 2 minutes planning your next action.',
              streak: goal.streak_count || 0,
              redirectUrl: 'https://goalmine.ai',
              isNudge: false,
              userId: goal.user_id,
              goalId: goal.id
            }
          });

          if (emailResponse.error) {
            console.error(`[DEBUG-HIJACKED] Email FAILED for ${goal.title}:`, emailResponse.error);
            results.push({ goal: goal.title, email, status: 'FAILED', error: emailResponse.error.message });
            errors++;
          } else {
            console.log(`[DEBUG-HIJACKED] ✅ EMAIL SENT for ${goal.title}`);
            
            // Mark as sent
            await supabase
              .from('goals')
              .update({ last_motivation_date: todayUTC })
              .eq('id', goal.id);

            results.push({ goal: goal.title, email, status: 'SUCCESS ✅' });
            emailsSent++;
          }

        } catch (error) {
          console.error(`[DEBUG-HIJACKED] Error processing ${goal.title}:`, error);
          results.push({ goal: goal.title, status: 'ERROR', error: error.message });
          errors++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `HIJACKED FUNCTION SUCCESS: Sent ${emailsSent} emails to your test accounts`,
      emailsSent,
      errors,
      totalGoals: activeGoals?.length || 0,
      results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[DEBUG-HIJACKED] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);