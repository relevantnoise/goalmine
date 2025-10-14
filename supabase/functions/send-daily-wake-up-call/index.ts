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

// AI-powered wake-up call generator
const generateWakeUpCall = async (): Promise<string> => {
  try {
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: `You are the world's most inspiring motivational coach. Write a single powerful 40-60 word paragraph that serves as a daily motivational shot in the arm.

Create urgency, energy, and excitement about making TODAY special. Universal tone that works for any goal type. Think "Let's do this together" energy.

Style: Confident, inspiring, action-oriented. No fluff - just pure motivation to get moving TODAY.

Focus on themes like:
- Today is YOUR moment 
- Action creates momentum
- Your future self is watching
- Champions are made in moments like this
- Don't let today slip away
- Make this day count

Return ONLY the motivational paragraph, nothing else.`
        }, {
          role: 'user', 
          content: 'Generate a fresh, powerful daily wake-up call message.'
        }],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const wakeUpMessage = data.choices?.[0]?.message?.content?.trim();

    if (!wakeUpMessage) {
      throw new Error('No content generated from OpenAI');
    }

    console.log('Generated wake-up call:', wakeUpMessage);
    return wakeUpMessage;

  } catch (error) {
    console.error('Error generating wake-up call:', error);
    // Fallback to powerful static messages if AI fails
    const fallbackMessages = [
      "Today isn't just another day - it's YOUR day to prove what you're made of. Every champion started with a single moment of decision, and yours is right now. The gap between dreaming and achieving closes when you take action.",
      "Your future self is watching what you do in the next 24 hours. Will you be the person who showed up, or the person who found excuses? Winners don't wait for motivation - they create it through action.",
      "This moment right here? This is where everything changes. Not tomorrow, not next week - TODAY. Your goals are calling and your potential is waiting. Time to show the world what you're made of.",
      "Every successful person has one thing in common: they turned ordinary days into extraordinary progress. Today is your chance to join them. Don't let this moment slip away."
    ];
    
    const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
    return fallbackMessages[randomIndex];
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[WAKE-UP-CALL] Starting daily wake-up call generation and sending');
    
    const todayUTC = new Date().toISOString().split('T')[0];
    console.log('[WAKE-UP-CALL] Processing date:', todayUTC);

    // Get all users who have active goals and haven't received today's wake-up call
    const { data: usersWithActiveGoals } = await supabase
      .from('goals')
      .select('user_id')
      .eq('is_active', true)
      .or(`last_motivation_date.is.null,last_motivation_date.neq.${todayUTC}`);

    if (!usersWithActiveGoals || usersWithActiveGoals.length === 0) {
      console.log('[WAKE-UP-CALL] No users need wake-up calls today');
      return new Response(JSON.stringify({
        success: true,
        emailsSent: 0,
        message: 'No users need wake-up calls today'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get unique users (handle both email and Firebase UID formats)
    const uniqueUsers = [...new Set(usersWithActiveGoals.map(goal => goal.user_id))];
    console.log(`[WAKE-UP-CALL] Found ${uniqueUsers.length} unique users with active goals`);

    // Generate fresh AI content for today
    const wakeUpMessage = await generateWakeUpCall();
    console.log('[WAKE-UP-CALL] Generated wake-up message');

    let emailsSent = 0;
    let emailErrors = 0;

    // Send one wake-up call email per user
    for (const userId of uniqueUsers) {
      try {
        console.log(`[WAKE-UP-CALL] Processing user: ${userId}`);

        // Get email address (handle both formats)
        let email = userId;
        if (!email.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
          email = profile?.email;
        }

        if (!email) {
          console.error(`[WAKE-UP-CALL] No email found for user: ${userId}`);
          emailErrors++;
          continue;
        }

        // Get user's active goal count for subject line
        const { data: userGoals } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true);

        const goalCount = userGoals?.length || 1;

        // Send wake-up call email
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: email,
            name: email.split('@')[0],
            goal: `${goalCount} Active Goal${goalCount !== 1 ? 's' : ''}`, // Generic goal reference
            message: wakeUpMessage,
            microPlan: [], // Not used in wake-up call
            challenge: "Check in to your dashboard and make today count!", 
            streak: 0, // Not goal-specific
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: userId,
            goalId: null, // No specific goal
            isWakeUpCall: true // New flag for different template
          }
        });

        if (emailResponse.error || !emailResponse.data?.success) {
          console.error(`[WAKE-UP-CALL] Email failed for ${userId}:`, emailResponse.error || 'Success=false');
          emailErrors++;
        } else {
          console.log(`[WAKE-UP-CALL] ✅ Wake-up call sent to ${email}`);
          
          // Mark user's goals as having received today's motivation
          await supabase
            .from('goals')
            .update({ last_motivation_date: todayUTC })
            .eq('user_id', userId)
            .eq('is_active', true);
          
          emailsSent++;
        }

      } catch (error) {
        console.error(`[WAKE-UP-CALL] Error processing user ${userId}:`, error);
        emailErrors++;
      }
    }

    const result = {
      success: true,
      emailsSent,
      errors: emailErrors,
      message: `Wake-up call system: Sent ${emailsSent} emails with ${emailErrors} errors`,
      wakeUpMessage: wakeUpMessage.substring(0, 100) + '...' // Preview for logging
    };

    console.log('[WAKE-UP-CALL] Daily wake-up call completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[WAKE-UP-CALL] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      emailsSent: 0,
      errors: 1
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);