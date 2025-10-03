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
    console.log('[HIJACKED-11:15] 🚀 HIJACKED FOR 11:15 AM TEST - NO TIME RESTRICTIONS');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // NO TIME RESTRICTIONS - SEND EMAILS NOW
    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];
    
    console.log('[HIJACKED-11:15] 📅 Today UTC date:', todayUTC);
    console.log('[HIJACKED-11:15] 🕐 Current UTC time:', now.toISOString());

    // Find ALL active goals
    console.log('[HIJACKED-11:15] 🔍 Finding all active goals...');
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[HIJACKED-11:15] ❌ Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[HIJACKED-11:15] 📊 Found ${allGoals?.length || 0} total active goals`);
    
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

    let emailsSent = 0;
    let errors = 0;

    for (const goal of allGoals) {
      try {
        console.log(`[HIJACKED-11:15] 🎯 Processing goal: "${goal.title}" (ID: ${goal.id})`);
        console.log(`[HIJACKED-11:15] 📧 User: ${goal.user_id}`);
        console.log(`[HIJACKED-11:15] 📅 Last email date: ${goal.last_motivation_date || 'never'}`);

        // FORCE PROCESSING - ignore last_motivation_date for testing
        console.log(`[HIJACKED-11:15] 🔥 FORCING EMAIL SEND - IGNORING LAST SENT DATE FOR TEST`);

        // Get user email (handle both email and Firebase UID formats)
        let userEmail = null;
        if (goal.user_id.includes('@')) {
          userEmail = goal.user_id;
          console.log(`[HIJACKED-11:15] 📧 Using email directly: ${userEmail}`);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .single();
          userEmail = profile?.email;
          console.log(`[HIJACKED-11:15] 🔍 Firebase UID lookup: ${goal.user_id} → ${userEmail}`);
        }

        if (!userEmail) {
          console.error(`[HIJACKED-11:15] ❌ No email found for goal: ${goal.title}`);
          errors++;
          continue;
        }

        // Generate motivation content
        const motivationContent = {
          message: `🔥 TEST EMAIL 11:15 AM EDT: Daily motivation for "${goal.title}". This is a test of the fixed email system!`,
          microPlan: [
            'Take one concrete action toward your goal today',
            'Track your progress and celebrate small wins', 
            'Visualize yourself achieving this goal'
          ],
          challenge: 'Spend 2 minutes right now planning your next step forward.'
        };

        console.log(`[HIJACKED-11:15] 📬 Sending TEST email to: ${userEmail}`);
        
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

        // CRITICAL: Use the FIXED success confirmation logic
        if (emailResponse.error || !emailResponse.data?.success) {
          console.error(`[HIJACKED-11:15] ❌ Email FAILED for ${goal.title}:`, emailResponse.error || 'Success=false');
          errors++;
          // DO NOT mark as sent when email fails
        } else {
          console.log(`[HIJACKED-11:15] ✅ Email SENT successfully for ${goal.title}`);
          
          // Only mark as sent after confirmed successful delivery
          const { error: updateError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayUTC })
            .eq('id', goal.id);

          if (updateError) {
            console.error(`[HIJACKED-11:15] ⚠️ Error marking as sent:`, updateError);
          } else {
            console.log(`[HIJACKED-11:15] ✅ Marked as sent: ${goal.title}`);
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[HIJACKED-11:15] ❌ Error processing ${goal.title}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      emailsSent,
      errors,
      totalGoals: allGoals.length,
      date: todayUTC,
      timestamp: now.toISOString(),
      message: `HIJACKED 11:15 TEST: Processed ${allGoals.length} goals. Sent ${emailsSent} emails with ${errors} errors.`
    };

    console.log('[HIJACKED-11:15] 🎉 TEST COMPLETE:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[HIJACKED-11:15] 💥 FATAL ERROR:', error);
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