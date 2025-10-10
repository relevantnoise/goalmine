import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateMotivationRequest {
  goalId: string | null;
  goalTitle: string;
  goalDescription?: string;
  tone: string;
  streakCount: number;
  userId: string;
  isNudge?: boolean;
  isGeneralNudge?: boolean;
  targetDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AI-GENERATION-v4] Using sophisticated ChatGPT prompt system with goal-specific expertise');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { goalId, goalTitle, goalDescription, tone, streakCount, userId, isNudge, isGeneralNudge, targetDate }: GenerateMotivationRequest = await req.json();

    // Enhanced tone personalities for life-changing coaching
    const tonePersonalities = {
      drill_sergeant: "You are a no-nonsense military drill instructor who demands excellence. You're tough but fair, direct but caring. You use military-style language, challenge excuses, and focus on discipline, commitment, and action. You don't coddle - you push. But everything comes from wanting to see this person WIN.",
      kind_encouraging: "You are a warm, empathetic coach who believes deeply in this person's potential. You're gentle but not soft, supportive but not enabling. You use nurturing language, acknowledge struggles with compassion, and focus on self-compassion, gradual progress, and inner strength. You celebrate every small win.",
      teammate: "You are their equal partner in this journey - not above them, but beside them. You use 'we' language, share in both struggles and victories, and focus on collaboration, mutual support, and collective problem-solving. You're the friend who shows up and does the hard work alongside them.",
      wise_mentor: "You are a sage advisor with deep life experience and wisdom. You use thoughtful, reflective language, share philosophical insights, and focus on the deeper meaning, life lessons, and long-term growth. You help them see the bigger picture and their goal as part of their life's journey."
    };

    // Goal-specific expertise system
    const getGoalExpertise = (goalTitle: string, goalDescription: string = '') => {
      const goalText = `${goalTitle} ${goalDescription}`.toLowerCase();
      
      if (goalText.includes('quit smoking') || goalText.includes('stop smoking')) {
        return {
          expertise: 'You have deep expertise in smoking cessation, understanding nicotine addiction, withdrawal symptoms, triggers, and proven strategies.',
          challenges: ['nicotine cravings', 'habit triggers', 'social situations', 'stress management'],
          strategies: ['replacement behaviors', 'deep breathing', 'trigger avoidance', 'support systems']
        };
      }
      
      if (goalText.includes('lose weight') || goalText.includes('weight loss') || goalText.includes('diet')) {
        return {
          expertise: 'You understand the psychology of eating, sustainable habits, and the emotional aspects of weight management.',
          challenges: ['emotional eating', 'social food situations', 'plateau periods', 'motivation fluctuations'],
          strategies: ['meal planning', 'mindful eating', 'gradual changes', 'non-food rewards']
        };
      }
      
      if (goalText.includes('exercise') || goalText.includes('workout') || goalText.includes('fitness')) {
        return {
          expertise: 'You understand exercise physiology, habit formation, and overcoming fitness barriers.',
          challenges: ['time constraints', 'motivation dips', 'physical discomfort', 'consistency issues'],
          strategies: ['progressive overload', 'habit stacking', 'accountability systems', 'variety in routines']
        };
      }
      
      if (goalText.includes('business') || goalText.includes('startup') || goalText.includes('entrepreneur')) {
        return {
          expertise: 'You understand the entrepreneurial journey, market challenges, and building sustainable businesses.',
          challenges: ['market validation', 'funding concerns', 'time management', 'imposter syndrome'],
          strategies: ['MVP development', 'customer feedback loops', 'revenue focus', 'networking']
        };
      }
      
      if (goalText.includes('learn') || goalText.includes('study') || goalText.includes('skill')) {
        return {
          expertise: 'You understand learning science, skill acquisition, and overcoming learning barriers.',
          challenges: ['information overload', 'practice consistency', 'plateaus', 'application gaps'],
          strategies: ['spaced repetition', 'active practice', 'teaching others', 'real-world application']
        };
      }
      
      if (goalText.includes('write') || goalText.includes('book') || goalText.includes('creative')) {
        return {
          expertise: 'You understand the creative process, overcoming blocks, and building creative habits.',
          challenges: ['perfectionism', 'creative blocks', 'time for creativity', 'self-doubt'],
          strategies: ['daily practice', 'rough drafts', 'inspiration gathering', 'community support']
        };
      }
      
      return {
        expertise: 'You are skilled at understanding human motivation, habit change, and personal development.',
        challenges: ['consistency', 'motivation', 'time management', 'self-doubt'],
        strategies: ['small daily actions', 'progress tracking', 'accountability', 'celebration of wins']
      };
    };

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Handle general nudge (not goal-specific)
    if (isGeneralNudge) {
      console.log('[ENHANCED-NUDGE-v2] 🚀 ENHANCED 20-30 WORD NUDGE FUNCTION CALLED - This confirms the enhanced version is active');
      const generalPrompt = `You are a motivational life coach providing powerful motivation boosts to help people achieve their goals.

Generate motivational content that inspires immediate action:

Return a JSON object with exactly these fields:
{
  "message": "Write a powerful, emotionally compelling motivational burst that creates immediate urgency. Use 30-45 words. Include both emotional WHY (deeper meaning) and specific action. Make them feel the cost of inaction and excitement of progress. Be personally transformative.",
  "microPlan": [],
  "challenge": ""
}`;

      // Use the same bulletproof generation for general nudges
      let content;
      let lastError;
      
      const models = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      
      for (const model of models) {
        try {
          console.log(`[GENERAL-NUDGE] Trying model: ${model}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: generalPrompt },
                { role: 'user', content: 'Generate a quick motivation boost - keep it short and punchy.' }
              ],
              temperature: 0.8,
              max_tokens: 300,
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${model}): ${response.status} ${errorText}`);
          }

          const data = await response.json();
          content = JSON.parse(data.choices[0].message.content);
          
          console.log(`[GENERAL-NUDGE] ✅ Success with ${model}`);
          break; // Success!
          
        } catch (error) {
          lastError = error;
          console.log(`[GENERAL-NUDGE] ❌ Failed with ${model}: ${error.message}`);
        }
      }
      
      if (!content) {
        console.error(`[GENERAL-NUDGE] All models failed. Last error:`, lastError);
        throw new Error(`General nudge generation failed: ${lastError?.message}`);
      }

      console.log('[ENHANCED-NUDGE-v3] ✅ Generated POWERFUL 30-45 word motivation burst:', content.message);

      return new Response(JSON.stringify(content), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get goal-specific expertise
    const goalExpertise = getGoalExpertise(goalTitle, goalDescription);
    const daysSinceStart = Math.max(1, dayOfYear % 30); // Simulate days since goal start
    const isNewGoal = daysSinceStart <= 3;
    const isStrongStreak = streakCount >= 7;
    const isStrugglingStreak = streakCount <= 2 && daysSinceStart > 7;

    const systemPrompt = `You are an AI-powered personal coach for GoalMine.ai, specifically helping someone achieve: "${goalTitle}"${goalDescription ? ` (${goalDescription})` : ''}.

COACHING PERSONALITY:
${tonePersonalities[tone] || tonePersonalities.kind_encouraging}

GOAL EXPERTISE:
${goalExpertise.expertise}
Common challenges for this goal: ${goalExpertise.challenges.join(', ')}
Proven strategies: ${goalExpertise.strategies.join(', ')}

CURRENT SITUATION:
- Goal: "${goalTitle}"
- Current streak: ${streakCount} days
- Status: ${isNewGoal ? 'Just getting started' : isStrongStreak ? 'Strong momentum' : isStrugglingStreak ? 'May be struggling' : 'Making progress'}
- Deadline: ${targetDate || 'No deadline set'}
- Request type: ${isNudge ? 'Urgent motivation nudge' : 'Daily motivation content'}

CREATE LIFE-CHANGING CONTENT:

${isNudge ? `
Generate URGENT NUDGE content - pure motivational fuel for immediate action:

Return JSON with:
{
  "message": "Write a powerful 30-45 word motivational burst specifically for '${goalTitle}'. Use authentic ${tone} voice. Include both the emotional WHY (life impact) and immediate WHAT (specific action). Create visceral urgency about the cost of waiting vs reward of acting. Reference their exact goal situation. Make them feel transformation is happening right now.",
  "microPlan": [""],
  "challenge": ""
}` : `
Generate DAILY MOTIVATION content - this person needs meaningful, specific guidance:

Return JSON with:
{
  "message": "Write 2-3 sentences of deeply specific advice for TODAY's work on '${goalTitle}'. Address their current streak (${streakCount} days), use goal-specific expertise, and authentic ${tone} tone. Avoid generic motivation - be practical and insightful.",
  "microPlan": ["Give exactly 3 specific actions they can take today (each 5-30 minutes) to advance '${goalTitle}'. Be concrete, build on each other logically, and specific to this goal type."],
  "challenge": "Create a meaningful reflection or mini-challenge tied specifically to '${goalTitle}' that encourages deeper engagement. One impactful sentence."
}`}

CRITICAL REQUIREMENTS:
- Be SPECIFIC to "${goalTitle}" - not generic goal advice
- Use authentic ${tone} voice throughout
- Reference their ${streakCount}-day streak contextually
- Draw from proven strategies for this goal type
- Make every word count toward their success
- Be their advocate, guide, and source of practical wisdom

This person chose you as their coach because they want to achieve something meaningful. Help them WIN.`;

    // Bulletproof AI generation with retry logic and multiple models
    let content;
    let lastError;
    
    const models = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      for (const model of models) {
        try {
          console.log(`[AI-GENERATION] Attempt ${attempt}, trying model: ${model}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate today's motivation for my goal: "${goalTitle}"` }
              ],
              temperature: 0.8,
              max_tokens: 500,
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${model}): ${response.status} ${errorText}`);
          }

          const data = await response.json();
          content = JSON.parse(data.choices[0].message.content);
          
          console.log(`[AI-GENERATION] ✅ Success with ${model} on attempt ${attempt}`);
          break; // Success! Exit both loops
          
        } catch (error) {
          lastError = error;
          console.log(`[AI-GENERATION] ❌ Failed with ${model}: ${error.message}`);
          
          // If this was our last model in this attempt, wait before next attempt
          if (model === models[models.length - 1] && attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
            console.log(`[AI-GENERATION] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (content) break; // Success! Exit retry loop
    }
    
    if (!content) {
      console.error(`[AI-GENERATION] All attempts failed. Last error:`, lastError);
      throw new Error(`AI generation failed after ${maxRetries} attempts with all models: ${lastError?.message}`);
    }

    // Save the generated motivation to the database (1-day storage only)
    if (goalId) {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
      const todayEnd = new Date(today + 'T23:59:59.999Z').toISOString();
      
      // First, clean up old motivation content (keep only today's content)
      const { error: cleanupError } = await supabase
        .from('motivation_history')
        .delete()
        .eq('goal_id', goalId)
        .lt('created_at', todayStart);

      if (cleanupError) {
        console.error('Error cleaning up old motivation:', cleanupError);
        // Continue anyway - cleanup failure shouldn't block new content
      }

      // Check if we already have motivation for today
      const { data: existingMotivation } = await supabase
        .from('motivation_history')
        .select('id')
        .eq('goal_id', goalId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .limit(1);

      // Only create new motivation if we don't have any for today
      if (!existingMotivation || existingMotivation.length === 0) {
        // Store today's motivation content
        const { error } = await supabase
          .from('motivation_history')
          .insert({
            goal_id: goalId,
            user_id: userId,
            message: content.message,
            micro_plan: content.microPlan,
            challenge: content.challenge,
            tone: tone,
            nudge_count: 1
          });

        if (error) {
          console.error('Error saving motivation:', error);
          // Don't throw error - continue with generated content even if save fails
        }
      }
    }

    console.log(`Generated fresh motivation for goal: ${goalTitle}`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-motivation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});