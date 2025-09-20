import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteGoalRequest {
  user_id: string;
  title: string;
  description?: string;
  target_date?: string;
  tone: 'drill_sergeant' | 'kind_encouraging' | 'teammate' | 'wise_mentor';
  time_of_day: string;
}

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
    // Parse and validate request
    const body: CompleteGoalRequest = await req.json();
    const { user_id, title, description, target_date, tone, time_of_day } = body;

    console.log('🔄 Creating complete goal for user:', user_id, 'title:', title);

    // Validation
    if (!user_id || !title || !tone || !time_of_day) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: user_id, title, tone, time_of_day" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Step 1: Create the goal with ALL fields
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert([{
        user_id,
        title,
        description: description || null,
        target_date: target_date || null,
        tone,
        time_of_day,
        is_active: true,
        streak_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (goalError) {
      console.error('❌ Error creating goal:', goalError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to create goal: ${goalError.message}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log('✅ Goal created successfully:', goal.id);

    // Step 2: Generate motivation content using OpenAI
    let motivationContent: MotivationContent;
    try {
      console.log('🔄 Generating initial motivation content...');
      
      // Build context for AI generation
      const contextInfo = [];
      if (description) contextInfo.push(`Goal description: ${description}`);
      if (target_date) contextInfo.push(`Target date: ${target_date}`);
      
      const toneInstructions = {
        'drill_sergeant': 'Be direct, commanding, and motivational like a military drill sergeant. Use strong, action-oriented language.',
        'kind_encouraging': 'Be warm, supportive, and encouraging like a caring friend. Use gentle but motivating language.',
        'teammate': 'Be collaborative and supportive like a workout partner. Use "we" language and team-oriented motivation.',
        'wise_mentor': 'Be thoughtful and wise like an experienced mentor. Provide insightful guidance and perspective.'
      };

      const prompt = `You are a ${tone.replace('_', ' ')} helping someone with their goal: "${title}"

${contextInfo.length > 0 ? contextInfo.join('\n') + '\n' : ''}

Generate motivational content in this exact JSON format:
{
  "message": "A motivational message (2-3 sentences) in the ${tone.replace('_', ' ')} style",
  "microPlan": ["Action step 1", "Action step 2", "Action step 3"],
  "challenge": "A quick 2-minute challenge they can do today"
}

${toneInstructions[tone]}

Keep it concise, actionable, and motivating. This is for their first day starting this goal.`;

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
      
      motivationContent = {
        message: content.message,
        microPlan: content.microPlan,
        challenge: content.challenge,
        tone: tone
      };

      console.log('✅ Generated motivation content successfully');
      
    } catch (aiError) {
      console.error('⚠️ AI generation failed, using fallback content:', aiError);
      
      // Fallback content if AI fails
      motivationContent = {
        message: `Great choice starting "${title}"! Every journey begins with a single step, and you're taking that step today.`,
        microPlan: [
          'Take 5 minutes to visualize your success',
          'Write down why this goal matters to you',
          'Plan your first small action for tomorrow'
        ],
        challenge: 'Spend 2 minutes right now writing down one reason why achieving this goal will improve your life.',
        tone: tone
      };
    }

    // Step 3: Save motivation content to database (upsert for today)
    const today = new Date().toISOString().split('T')[0];
    console.log('💾 Saving motivation content to database...', {
      goal_id: goal.id,
      user_id: user_id,
      date: today,
      messageLength: motivationContent.message.length,
      microPlanLength: motivationContent.microPlan.length
    });

    const { data: savedMotivation, error: motivationError } = await supabase
      .from('motivation_history')
      .upsert([{
        goal_id: goal.id,
        user_id: user_id,
        date: today,
        message: motivationContent.message,
        micro_plan: motivationContent.microPlan,
        challenge: motivationContent.challenge,
        tone: motivationContent.tone,
        created_at: new Date().toISOString()
      }], {
        onConflict: 'goal_id,date'
      })
      .select()
      .single();

    if (motivationError) {
      console.error('❌ CRITICAL: Failed to save motivation to database:', motivationError);
      console.error('❌ Motivation data:', motivationContent);
      // This is critical - without this, goal detail page will be empty
    } else {
      console.log('✅ Motivation content saved to database successfully:', savedMotivation.id);
    }

    // Step 4: Send first motivational email
    try {
      console.log('📧 Sending first motivational email...');
      
      await supabase.functions.invoke('send-motivation-email', {
        body: {
          userId: user_id,
          goalId: goal.id,
          goalTitle: title,
          userEmail: user_id, // Assuming user_id is email, adjust if needed
          motivation: motivationContent,
          timeOfDay: time_of_day
        }
      });
      
      console.log('✅ First motivational email sent successfully');
      
    } catch (emailError) {
      console.error('⚠️ Failed to send email (non-blocking):', emailError);
      // Don't fail the operation - email is not critical for goal creation
    }

    // Step 5: Return complete goal with generated content
    console.log('✅ Goal creation completed successfully');
    return new Response(JSON.stringify({ 
      success: true, 
      goal: goal,
      motivation: motivationContent
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Critical error in create-complete-goal:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});