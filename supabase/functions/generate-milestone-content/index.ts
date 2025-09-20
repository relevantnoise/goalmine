import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateMilestoneRequest {
  goalTitle: string;
  goalDescription?: string;
  tone: string;
  streak: number;
  targetDate?: string;
  milestoneLabel: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalTitle, goalDescription, tone, streak, targetDate, milestoneLabel }: GenerateMilestoneRequest = await req.json();

    const tonePersonalities = {
      drill_sergeant: "You're a tough, no-nonsense military drill sergeant who pushes people to excellence. Be direct, motivating, and results-focused without being mean.",
      kind_encouraging: "You're a warm, nurturing coach who believes in gentle encouragement and celebrates every small step. Be supportive and understanding.",
      teammate: "You're an enthusiastic teammate who emphasizes collaboration and shared success. Be energetic and inclusive.",
      wise_mentor: "You're a wise, experienced mentor who provides thoughtful guidance and deeper perspective. Be reflective and insightful."
    };

    const systemPrompt = `You are a personalized goal coach celebrating a milestone with the personality of: ${tonePersonalities[tone] || tonePersonalities.kind_encouraging}

Someone has just achieved their first 7-day streak on their goal:

Goal: "${goalTitle}"
${goalDescription ? `Description: "${goalDescription}"` : ''}
${targetDate ? `Target Date: ${targetDate}` : ''}
Milestone: ${milestoneLabel}
Current Streak: ${streak} days
Coaching Style: ${tone}

This is a significant achievement worth celebrating! Generate milestone content.

Return a JSON object with exactly this field:
{
  "nextStep": "Suggest the single most impactful next step to keep momentum on ${goalTitle}. Be specific, actionable, and inspiring. One powerful sentence that builds on their success."
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate milestone celebration content for achieving ${milestoneLabel} on "${goalTitle}"` }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    console.log(`Generated milestone content for ${milestoneLabel} on goal: ${goalTitle}`);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-milestone-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      nextStep: `Now that you've achieved your ${milestoneLabel}, focus on your next win - take one meaningful action toward "${goalTitle}" today and keep building on this incredible momentum!`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});