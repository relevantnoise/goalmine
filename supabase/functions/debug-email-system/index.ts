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
    console.log('[SIMPLE-REBUILD] 🚀 Starting ULTRA-SIMPLE daily email system');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SIMPLE UTC DATE LOGIC - No timezone complexity
    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('[SIMPLE-REBUILD] 📅 Today UTC date:', todayUTC);
    console.log('[SIMPLE-REBUILD] 🕐 Current UTC time:', now.toISOString());

    // STEP 1: Find ALL active goals (no complex filters)
    console.log('[SIMPLE-REBUILD] 🔍 Finding all active goals...');
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[SIMPLE-REBUILD] ❌ Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[SIMPLE-REBUILD] 📊 Found ${allGoals?.length || 0} total active goals`);
    
    if (!allGoals || allGoals.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active goals found',
        emailsSent: 0,
        errors: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // STEP 2: Process each goal with SIMPLE logic
    let emailsSent = 0;
    let errors = 0;

    for (const goal of allGoals) {
      try {
        console.log(`[SIMPLE-REBUILD] 🎯 Processing goal: "${goal.title}" (ID: ${goal.id})`);
        console.log(`[SIMPLE-REBUILD] 📧 User: ${goal.user_id}`);
        console.log(`[SIMPLE-REBUILD] 📅 Last email date: ${goal.last_motivation_date || 'never'}`);

        // SIMPLE CHECK: Skip if already sent today
        if (goal.last_motivation_date === todayUTC) {
          console.log(`[SIMPLE-REBUILD] ⏭️ Already sent today, skipping`);
          continue;
        }

        // STEP 3: Get user email (handle both email and Firebase UID formats)
        let userEmail = null;
        if (goal.user_id.includes('@')) {
          // Email format - use directly
          userEmail = goal.user_id;
          console.log(`[SIMPLE-REBUILD] 📧 Using email directly: ${userEmail}`);
        } else {
          // Firebase UID - lookup email from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .single();
          userEmail = profile?.email;
          console.log(`[SIMPLE-REBUILD] 🔍 Firebase UID lookup: ${goal.user_id} → ${userEmail}`);
        }

        if (!userEmail) {
          console.error(`[SIMPLE-REBUILD] ❌ No email found for goal: ${goal.title}`);
          errors++;
          continue;
        }

        // STEP 4: Generate simple motivation content
        console.log(`[SIMPLE-REBUILD] 🤖 Generating motivation for: ${goal.title}`);
        
        const motivationContent = {
          message: `Good morning! Time to make progress on your goal: "${goal.title}". Every day is a new opportunity to move closer to what you want to achieve.`,
          microPlan: [
            'Take one concrete action toward your goal today',
            'Track your progress and celebrate small wins', 
            'Visualize yourself achieving this goal'
          ],
          challenge: 'Spend 2 minutes right now planning your next step forward.'
        };

        console.log(`[SIMPLE-REBUILD] ✅ Simple motivation content ready`);

        // STEP 5: Send email via Resend
        console.log(`[SIMPLE-REBUILD] 📬 Sending email to: ${userEmail}`);
        
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: userEmail,
            name: userEmail.split('@')[0],
            goal: goal.title,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan,
            challenge: motivationContent.challenge,
            streak: goal.streak_count || 0,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: goal.user_id,
            goalId: goal.id
          }
        });

        // STEP 6: Check if email succeeded
        if (emailResponse.error) {
          console.error(`[SIMPLE-REBUILD] ❌ Email FAILED for ${goal.title}:`, emailResponse.error);
          errors++;
          // Don't mark as sent if email failed
        } else {
          console.log(`[SIMPLE-REBUILD] ✅ Email SENT successfully for ${goal.title}`);
          
          // Mark as sent today
          const { error: updateError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayUTC })
            .eq('id', goal.id);

          if (updateError) {
            console.error(`[SIMPLE-REBUILD] ⚠️ Error marking as sent:`, updateError);
          } else {
            console.log(`[SIMPLE-REBUILD] ✅ Marked as sent: ${goal.title}`);
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[SIMPLE-REBUILD] ❌ Error processing ${goal.title}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      emailsSent,
      errors,
      totalGoals: allGoals.length,
      date: todayUTC,
      message: `SIMPLE REBUILD: Processed ${allGoals.length} goals. Sent ${emailsSent} emails with ${errors} errors.`
    };

    console.log('[SIMPLE-REBUILD] 🎉 COMPLETE:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[SIMPLE-REBUILD] 💥 FATAL ERROR:', error);
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