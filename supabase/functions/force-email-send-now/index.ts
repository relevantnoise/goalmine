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
    console.log('[FORCE-EMAIL] 🚀 FORCING EMAIL SEND - NO RESTRICTIONS');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];
    
    console.log('[FORCE-EMAIL] 📅 Today UTC date:', todayUTC);

    // Get ALL active goals - no filters
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('[FORCE-EMAIL] ❌ Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[FORCE-EMAIL] 📊 Found ${allGoals?.length || 0} total active goals`);
    
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
    const results = [];

    for (const goal of allGoals) {
      try {
        console.log(`[FORCE-EMAIL] 🎯 Processing goal: "${goal.title}" (ID: ${goal.id})`);
        console.log(`[FORCE-EMAIL] 📧 User ID: ${goal.user_id}`);
        console.log(`[FORCE-EMAIL] 📅 Last email date: ${goal.last_motivation_date || 'never'}`);
        console.log(`[FORCE-EMAIL] 🕐 Time of day: ${goal.time_of_day || 'none'}`);

        // HYBRID EMAIL LOOKUP - handle both email and Firebase UID formats
        let userEmail = null;
        if (goal.user_id.includes('@')) {
          // Email format - use directly
          userEmail = goal.user_id;
          console.log(`[FORCE-EMAIL] 📧 Using email directly: ${userEmail}`);
        } else {
          // Firebase UID - lookup email from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', goal.user_id)
            .single();
          userEmail = profile?.email;
          console.log(`[FORCE-EMAIL] 🔍 Firebase UID lookup: ${goal.user_id} → ${userEmail}`);
        }

        if (!userEmail) {
          console.error(`[FORCE-EMAIL] ❌ No email found for goal: ${goal.title}`);
          results.push({ goal: goal.title, status: 'No email found' });
          errors++;
          continue;
        }

        // Generate motivation content
        const motivationContent = {
          message: `Daily motivation for "${goal.title}". Keep pushing forward - you've got this!`,
          microPlan: [
            'Take one concrete action toward your goal today',
            'Track your progress and celebrate small wins', 
            'Stay focused on your why'
          ],
          challenge: 'Spend 5 minutes planning your next steps.'
        };

        console.log(`[FORCE-EMAIL] 📬 Sending email to: ${userEmail}`);
        
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
          console.error(`[FORCE-EMAIL] ❌ Email FAILED for ${goal.title}:`, emailResponse.error || 'Success=false');
          results.push({ goal: goal.title, email: userEmail, status: 'FAILED', error: emailResponse.error?.message || 'Success=false' });
          errors++;
        } else {
          console.log(`[FORCE-EMAIL] ✅ Email SENT successfully for ${goal.title}`);
          
          // Only mark as sent after confirmed successful delivery
          const { error: updateError } = await supabase
            .from('goals')
            .update({ last_motivation_date: todayUTC })
            .eq('id', goal.id);

          if (updateError) {
            console.error(`[FORCE-EMAIL] ⚠️ Error marking as sent:`, updateError);
            results.push({ goal: goal.title, email: userEmail, status: 'Sent but not marked' });
          } else {
            console.log(`[FORCE-EMAIL] ✅ Marked as sent: ${goal.title}`);
            results.push({ goal: goal.title, email: userEmail, status: 'SUCCESS ✅' });
            emailsSent++;
          }
        }

      } catch (error) {
        console.error(`[FORCE-EMAIL] ❌ Error processing ${goal.title}:`, error);
        results.push({ goal: goal.title, status: 'ERROR', error: error.message });
        errors++;
      }
    }

    const result = {
      success: true,
      emailsSent,
      errors,
      totalGoals: allGoals.length,
      results,
      date: todayUTC,
      timestamp: now.toISOString(),
      message: `FORCED EMAIL SEND: Processed ${allGoals.length} goals. Sent ${emailsSent} emails with ${errors} errors.`
    };

    console.log('[FORCE-EMAIL] 🎉 COMPLETE:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('[FORCE-EMAIL] 💥 FATAL ERROR:', error);
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