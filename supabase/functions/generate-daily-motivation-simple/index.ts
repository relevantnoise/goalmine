import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Simple motivation generation starting');
    
    const body = await req.json();
    const { goalTitle, tone, streakCount, goalId, userId } = body;
    
    console.log(`📝 Generating for goal: ${goalTitle}, streak: ${streakCount}`);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try OpenAI generation first
    let motivationContent;
    
    try {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      console.log('🔑 OpenAI key available:', !!openAIApiKey);
      
      if (!openAIApiKey) {
        throw new Error('No OpenAI key');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Create a motivational message for someone working on: "${goalTitle}". They have a streak of ${streakCount} days. Use a ${tone} tone. Return JSON with: message, microPlan (array of 3 steps), challenge.`
          }],
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          motivationContent = JSON.parse(content);
          console.log('✅ OpenAI generation successful');
        } catch {
          // If JSON parsing fails, create structured content
          motivationContent = {
            message: content,
            microPlan: ['Take one small step today', 'Stay consistent', 'Celebrate your progress'],
            challenge: 'Spend 5 minutes working on your goal right now'
          };
        }
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
    } catch (aiError) {
      console.log('⚠️ AI generation failed, using fallback:', aiError.message);
      
      // Fallback motivation content
      motivationContent = {
        message: `Great job maintaining your ${streakCount}-day streak on "${goalTitle}"! Every day you show up is a step closer to success. Keep building that momentum!`,
        microPlan: [
          'Take one focused action on your goal today',
          'Track your progress, however small',
          'Prepare for tomorrow by planning your next step'
        ],
        challenge: 'Right now, take 2 minutes to visualize yourself successfully completing this goal.'
      };
    }

    // Save to database
    if (goalId && userId) {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('motivation_history')
        .upsert({
          goal_id: goalId,
          user_id: userId,
          date: today,
          message: motivationContent.message,
          micro_plan: motivationContent.microPlan,
          challenge: motivationContent.challenge,
          tone: tone || 'kind_encouraging',
          streak_count: streakCount || 0
        }, {
          onConflict: 'goal_id,date'
        });
        
      console.log('💾 Saved to motivation_history');
    }

    console.log('✅ Motivation generation completed');
    
    return new Response(JSON.stringify({
      success: true,
      ...motivationContent
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in simple motivation generation:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});