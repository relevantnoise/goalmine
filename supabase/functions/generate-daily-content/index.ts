import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MotivationContent {
  message: string;
  microPlan: string[];
  challenge: string;
  tone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Daily content generation started');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active goals that need fresh content for today
    const today = new Date().toISOString().split('T')[0];
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true);

    if (goalsError) {
      console.error('❌ Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`📊 Found ${goals.length} active goals to generate content for`);

    // Generate content for each goal
    const results = [];
    for (const goal of goals) {
      try {
        console.log(`🎯 Generating content for goal: ${goal.title}`);

        // Check if we already have content for today
        const { data: existingContent } = await supabase
          .from('motivation_history')
          .select('id')
          .eq('goal_id', goal.id)
          .eq('date', today)
          .single();

        if (existingContent) {
          console.log(`⏭️  Content already exists for ${goal.title} today`);
          continue;
        }

        // Generate new content using OpenAI
        const motivationContent = await generateMotivationContent(goal);
        
        if (!motivationContent) {
          console.error(`❌ Failed to generate content for ${goal.title}`);
          continue;
        }

        // Save to database
        const { error: saveError } = await supabase
          .from('motivation_history')
          .insert({
            goal_id: goal.id,
            user_id: goal.user_id,
            date: today,
            message: motivationContent.message,
            micro_plan: motivationContent.microPlan,
            challenge: motivationContent.challenge,
            tone: motivationContent.tone,
          });

        if (saveError) {
          console.error(`❌ Error saving content for ${goal.title}:`, saveError);
          continue;
        }

        console.log(`✅ Generated and saved content for: ${goal.title}`);
        results.push({ goalId: goal.id, title: goal.title, success: true });

      } catch (error) {
        console.error(`❌ Error processing goal ${goal.title}:`, error);
        results.push({ goalId: goal.id, title: goal.title, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: goals.length,
      results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in generate-daily-content:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateMotivationContent(goal: any): Promise<MotivationContent | null> {
  try {
    console.log(`🤖 Generating LLM content for: ${goal.title}`);
    
    // Build context for AI generation
    const contextInfo = [];
    if (goal.description) contextInfo.push(`Goal description: ${goal.description}`);
    if (goal.target_date) contextInfo.push(`Target date: ${goal.target_date}`);
    contextInfo.push(`Current streak: ${goal.streak_count} days`);
    
    const toneInstructions = {
      'drill_sergeant': 'Be direct, commanding, and motivational like a military drill sergeant. Use strong, action-oriented language.',
      'kind_encouraging': 'Be warm, supportive, and encouraging like a caring friend. Use gentle but motivating language.',
      'teammate': 'Be collaborative and supportive like a workout partner. Use "we" language and team-oriented motivation.',
      'wise_mentor': 'Be thoughtful and wise like an experienced mentor. Provide insightful guidance and perspective.'
    };

    const prompt = `You are a ${goal.tone.replace('_', ' ')} helping someone with their goal: "${goal.title}"

${contextInfo.length > 0 ? contextInfo.join('\n') + '\n' : ''}

Generate motivational content in this exact JSON format:
{
  "message": "A motivational message (2-3 sentences) in the ${goal.tone.replace('_', ' ')} style",
  "microPlan": ["Action step 1", "Action step 2", "Action step 3"],
  "challenge": "A quick 2-minute challenge they can do today"
}

${toneInstructions[goal.tone]}

Keep it concise, actionable, and motivating. This is for day ${goal.streak_count + 1} of their streak.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = JSON.parse(aiResponse.choices[0].message.content);
    
    return {
      message: content.message,
      microPlan: content.microPlan,
      challenge: content.challenge,
      tone: goal.tone
    };

  } catch (aiError) {
    console.error('⚠️ AI generation failed, using fallback content:', aiError);
    
    // Fallback content if AI fails
    return {
      message: `Great work on day ${goal.streak_count + 1} of "${goal.title}"! Every day you show up is a victory. Keep building this incredible momentum.`,
      microPlan: [
        'Take 5 minutes to visualize your success',
        'Write down one reason why this goal matters to you',
        'Plan your next small action step'
      ],
      challenge: 'Spend 2 minutes right now writing down one thing you learned about yourself through pursuing this goal.',
      tone: goal.tone
    };
  }
}