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
    console.log('[NUCLEAR-SIMPLE] 🚀 ULTRA-SIMPLE email system - no complexity');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // DEAD SIMPLE: Today's date in UTC
    const todayUTC = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('[NUCLEAR-SIMPLE] 📅 Today UTC:', todayUTC);

    // STEP 1: Reset ALL goals so we can test immediately
    console.log('[NUCLEAR-SIMPLE] 🔄 Resetting ALL goals for fresh test...');
    const { data: resetGoals, error: resetError } = await supabase
      .from('goals')
      .update({ last_motivation_date: null })
      .eq('is_active', true)
      .select();

    if (resetError) {
      console.error('[NUCLEAR-SIMPLE] ❌ Reset error:', resetError);
    } else {
      console.log(`[NUCLEAR-SIMPLE] ✅ Reset ${resetGoals?.length || 0} goals`);
    }

    // STEP 2: Get ALL active goals (super simple)
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[NUCLEAR-SIMPLE] ❌ Error fetching goals:', goalsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: goalsError.message,
        debug: { todayUTC }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[NUCLEAR-SIMPLE] 🎯 Found ${allGoals?.length || 0} active goals`);
    
    // Debug: Show all goals
    if (allGoals) {
      allGoals.forEach((goal, i) => {
        console.log(`[NUCLEAR-SIMPLE] Goal ${i+1}: "${goal.title}" | User: ${goal.user_id} | Last email: ${goal.last_motivation_date}`);
      });
    }

    if (!allGoals || allGoals.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No active goals found',
        emailsSent: 0,
        errors: 0,
        debug: { todayUTC, totalGoals: 0 }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // STEP 3: Process each goal - DEAD SIMPLE
    let emailsSent = 0;
    let errors = 0;
    const results = [];

    for (const goal of allGoals) {
      try {
        console.log(`[NUCLEAR-SIMPLE] 📧 Processing: "${goal.title}" for ${goal.user_id}`);

        // Get email address
        let email = goal.user_id;
        if (!email.includes('@')) {
          // Firebase UID - lookup email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .single();
          email = profile?.email;
        }

        if (!email) {
          console.error(`[NUCLEAR-SIMPLE] ❌ No email for goal: ${goal.title}`);
          results.push({ goal: goal.title, status: 'No email found' });
          errors++;
          continue;
        }

        console.log(`[NUCLEAR-SIMPLE] 📬 Sending to: ${email}`);

        // Simple motivation content
        const content = {
          message: `Good morning! Time to work on "${goal.title}". Today is a perfect day to make progress toward your goal.`,
          microPlan: [
            'Take one concrete step forward today',
            'Track your progress and celebrate wins',
            'Visualize achieving this goal'
          ],
          challenge: 'Spend 2 minutes planning your next action.'
        };

        // Send email
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: email,
            name: email.split('@')[0],
            goal: goal.title,
            message: content.message,
            microPlan: content.microPlan,
            challenge: content.challenge,
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          }
        });

        if (emailResponse.error) {
          console.error(`[NUCLEAR-SIMPLE] ❌ Email FAILED for ${goal.title}:`, emailResponse.error);
          results.push({ goal: goal.title, email, status: 'Email failed', error: emailResponse.error.message });
          errors++;
        } else {
          console.log(`[NUCLEAR-SIMPLE] ✅ Email SENT to ${email} for ${goal.title}`);
          
          // Mark as sent
          await supabase
            .from('goals')
            .update({ last_motivation_date: todayUTC })
            .eq('id', goal.id);

          results.push({ goal: goal.title, email, status: 'SUCCESS' });
          emailsSent++;
        }

      } catch (error) {
        console.error(`[NUCLEAR-SIMPLE] ❌ Error processing ${goal.title}:`, error);
        results.push({ goal: goal.title, status: 'Error', error: error.message });
        errors++;
      }
    }

    const finalResult = {
      success: true,
      emailsSent,
      errors,
      totalGoals: allGoals.length,
      message: `NUCLEAR SIMPLE: Sent ${emailsSent} emails, ${errors} errors`,
      debug: {
        todayUTC,
        results
      }
    };

    console.log('[NUCLEAR-SIMPLE] 🎉 FINAL RESULT:', finalResult);

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[NUCLEAR-SIMPLE] 💥 FATAL ERROR:', error);
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