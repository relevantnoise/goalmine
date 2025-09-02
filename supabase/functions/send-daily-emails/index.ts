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
    console.log('[DAILY-EMAILS] Starting daily email send process');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time in Eastern timezone
    const now = new Date();
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    const currentMinute = parseInt(easternTime.split(':')[1]);
    
    // Simple delivery time: 7:00 AM Eastern
    const DELIVERY_HOUR = 7;
    const DELIVERY_MINUTE = 0;
    
    console.log(`[DAILY-EMAILS] Current Eastern time: ${easternTime} (${currentHour}:${currentMinute})`);
    console.log(`[DAILY-EMAILS] Delivery time: ${DELIVERY_HOUR}:${String(DELIVERY_MINUTE).padStart(2, '0')} Eastern`);

    // Get goals that need motivation today
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.lt.${new Date().toISOString().split('T')[0]}`);

    if (goalsError) {
      console.error('[DAILY-EMAILS] Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`[DAILY-EMAILS] Found ${goals?.length || 0} goals to process`);

    let emailsSent = 0;
    let errors = 0;

    for (const goal of goals || []) {
      try {
        // Get the user's profile for email address
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', goal.user_id)
          .single();
          
        if (profileError || !profile) {
          console.error(`[DAILY-EMAILS] Could not find profile for goal ${goal.title}:`, profileError);
          errors++;
          continue;
        }
        
        // Step 1: Ensure motivation content exists (generate if needed)
        const today = new Date().toISOString().split('T')[0];
        const { data: existingMotivation, error: motivationCheckError } = await supabase
          .from('motivation_history')
          .select('*')
          .eq('goal_id', goal.id)
          .eq('user_id', goal.user_id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let motivationContent;
        
        // Check if we need fresh content due to streak change
        const needsFreshContent = !existingMotivation || 
          (existingMotivation.streak_count !== goal.streak_count);
        
        if (needsFreshContent) {
          if (existingMotivation) {
            console.log(`[DAILY-EMAILS] Streak changed from ${existingMotivation.streak_count} to ${goal.streak_count} for ${goal.title} - regenerating content`);
          } else {
            console.log(`[DAILY-EMAILS] No existing motivation for ${goal.title} - generating fresh content`);
          }
          // Generate AI motivation content since it doesn't exist for today
          try {
            console.log(`[DAILY-EMAILS] Pre-generating AI motivation for goal: ${goal.title}`);
            const aiResponse = await supabase.functions.invoke('generate-daily-motivation', {
              body: {
                goalId: goal.id,
                goalTitle: goal.title,
                goalDescription: goal.description || '',
                tone: goal.tone || 'kind_encouraging',
                streakCount: goal.streak_count || 0,
                userId: goal.user_id,
                targetDate: goal.target_date || null,
                isNudge: false
              }
            });
            
            if (aiResponse.error) {
              console.error(`[DAILY-EMAILS] AI generation error for ${goal.title}:`, aiResponse.error);
              throw new Error('AI generation failed');
            }
            
            motivationContent = aiResponse.data;
            console.log(`[DAILY-EMAILS] Successfully pre-generated AI content for ${goal.title}`);
            
          } catch (error) {
            console.error(`[DAILY-EMAILS] Failed to generate AI content, using fallback:`, error);
            // Fallback content if AI generation fails
            motivationContent = {
              message: `Today is another opportunity to make progress on your goal: ${goal.title}. Keep building momentum!`,
              microPlan: ['Take one small action toward your goal today', 'Document your progress, however small', 'Reflect on how far you have already come'],
              challenge: 'Right now, take 30 seconds to visualize yourself achieving this goal.'
            };
          }
        } else {
          // Use existing motivation content (streak unchanged)
          motivationContent = {
            message: existingMotivation.message,
            microPlan: Array.isArray(existingMotivation.micro_plan) ? existingMotivation.micro_plan : [existingMotivation.micro_plan],
            challenge: existingMotivation.challenge || ''
          };
          console.log(`[DAILY-EMAILS] Using existing motivation content for ${goal.title} (streak unchanged at ${goal.streak_count})`);
        }
        
        // Step 2: Only send email if it's 7:00 AM Eastern or later
        const shouldSendEmail = currentHour > DELIVERY_HOUR || (currentHour === DELIVERY_HOUR && currentMinute >= DELIVERY_MINUTE);
        
        if (shouldSendEmail) {
          console.log(`[DAILY-EMAILS] Sending email for goal: ${goal.title} to ${profile.email}`);
          
          // Call the send-motivation-email function with pre-generated content
          const emailResponse = await supabase.functions.invoke('send-motivation-email', {
            body: {
              email: profile.email,
              name: profile.email.split('@')[0],
              goal: goal.title,
              message: motivationContent.message,
              microPlan: Array.isArray(motivationContent.microPlan) ? 
                motivationContent.microPlan.join('\n• ') : 
                motivationContent.microPlan,
              challenge: motivationContent.challenge,
              streak: goal.streak_count,
              redirectUrl: 'https://goalmine.ai',
              isNudge: false,
              userId: goal.user_id,
              goalId: goal.id
            }
          });

          if (emailResponse.error) {
            console.error(`[DAILY-EMAILS] Error sending email for goal ${goal.title}:`, emailResponse.error);
            errors++;
          } else {
            console.log(`[DAILY-EMAILS] Successfully sent email for goal: ${goal.title}`);
            emailsSent++;
            
            // Update the goal's last motivation date
            await supabase
              .from('goals')
              .update({ last_motivation_date: new Date().toISOString().split('T')[0] })
              .eq('id', goal.id);
          }
        } else {
          console.log(`[DAILY-EMAILS] Content ready for ${goal.title} but waiting for ${DELIVERY_HOUR}:${String(DELIVERY_MINUTE).padStart(2, '0')} Eastern. Current time: ${currentHour}:${currentMinute}`);
        }
      } catch (error) {
        console.error(`[DAILY-EMAILS] Error processing goal ${goal.title}:`, error);
        errors++;
      }
    }

    console.log(`[DAILY-EMAILS] Process complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Daily email process completed. Sent ${emailsSent} emails with ${errors} errors.`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[DAILY-EMAILS] Fatal error:', error);
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