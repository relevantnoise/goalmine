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
    console.log('[MANUAL-EMAILS] Starting manual email send with known users');
    
    const { forceDelivery } = req.method === 'POST' ? await req.json() : {};

    // Get current time and check delivery window
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    
    const easternTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const currentHour = parseInt(easternTime.split(':')[0]);
    
    console.log(`[MANUAL-EMAILS] UTC date: ${todayDate}`);
    console.log(`[MANUAL-EMAILS] Current Eastern time: ${easternTime} (${currentHour})`);

    // Check delivery window
    const isProperDeliveryWindow = currentHour >= 7 && currentHour <= 10;
    if (!isProperDeliveryWindow && !forceDelivery) {
      console.log(`[MANUAL-EMAILS] Outside delivery window, skipping. Current hour: ${currentHour}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Outside delivery window. Daily emails only send 7-10 AM EDT.`,
          emailsSent: 0,
          errors: 0,
          skipped: true
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[MANUAL-EMAILS] ✅ Within delivery window, proceeding with manual email delivery`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // MANUAL APPROACH: Use the known active users and send emails directly
    const knownUsers = [
      {
        email: "danlynn@gmail.com",
        goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
        goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
        tone: "drill_sergeant",
        streak: 5,
        userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3"
      },
      {
        email: "dandlynn@yahoo.com", 
        goalTitle: "Launch CleverVibes.ai - an application developed to help create awareness for vibe coders.",
        goalDescription: "I want to launch CleverVibes.ai in order to help all of the innovative vibe coders create awareness of their inventions.",
        tone: "drill_sergeant",
        streak: 4,
        userId: "8MZNQ8sG1VfWaBd74A39jNzyZmL2"
      }
    ];

    let emailsSent = 0;
    let errors = 0;

    for (const user of knownUsers) {
      try {
        console.log(`[MANUAL-EMAILS] Processing: ${user.email} - "${user.goalTitle}"`);
        
        // Generate AI content
        const aiResponse = await supabase.functions.invoke('generate-daily-motivation', {
          body: {
            goalTitle: user.goalTitle,
            goalDescription: user.goalDescription,
            tone: user.tone,
            streakCount: user.streak,
            userId: user.userId,
            isNudge: false,
            targetDate: "2025-11-15"
          }
        });

        let motivationContent;
        if (aiResponse.error || !aiResponse.data?.success) {
          console.log(`[MANUAL-EMAILS] AI generation failed, using fallback for ${user.email}`);
          motivationContent = {
            message: `Today is another opportunity to make progress on your goal: ${user.goalTitle}. Keep building momentum!`,
            microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your achievements'],
            challenge: 'Take 30 seconds to visualize achieving this goal.'
          };
        } else {
          console.log(`[MANUAL-EMAILS] ✅ AI content generated for ${user.email}`);
          motivationContent = {
            message: aiResponse.data.message,
            microPlan: aiResponse.data.microPlan,
            challenge: aiResponse.data.challenge
          };
        }

        console.log(`[MANUAL-EMAILS] Sending email to: ${user.email}`);
        
        // Send email via Resend
        const emailResponse = await supabase.functions.invoke('send-motivation-email', {
          body: {
            email: user.email,
            name: user.email.split('@')[0],
            goal: user.goalTitle,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan,
            challenge: motivationContent.challenge,
            streak: user.streak,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: user.userId,
            goalId: `manual-${user.email}`
          }
        });

        if (emailResponse.error || !emailResponse.data?.success) {
          console.error(`[MANUAL-EMAILS] ❌ Email failed for ${user.email}:`, emailResponse.error);
          errors++;
        } else {
          console.log(`[MANUAL-EMAILS] ✅ Email sent successfully to ${user.email}`);
          emailsSent++;
        }

      } catch (error) {
        console.error(`[MANUAL-EMAILS] Error processing ${user.email}:`, error);
        errors++;
      }
    }

    console.log(`[MANUAL-EMAILS] Complete. Sent: ${emailsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        errors,
        message: `Manual email process completed. Sent ${emailsSent} emails with ${errors} errors.`,
        approach: 'manual_bypass'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[MANUAL-EMAILS] Fatal error:', error);
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