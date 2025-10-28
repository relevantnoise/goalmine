import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoalData {
  title: string;
  description?: string;
  targetDate: string;
  element: string;
}

interface SMARTAnalysis {
  specific: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  measurable: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  achievable: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  relevant: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  timeBound: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  overallScore: number;
  overallFeedback: string;
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { goalData }: { goalData: GoalData } = await req.json();

    console.log('[SMART-VALIDATION] Validating goal:', goalData.title);

    // Create SMART validation prompt
    const prompt = `You are an expert goal-setting consultant specializing in SMART goal methodology. Analyze this goal and provide detailed feedback.

GOAL TO ANALYZE:
Title: "${goalData.title}"
Description: "${goalData.description || 'No description provided'}"
Target Date: "${goalData.targetDate}"
Life Element: "${goalData.element}"

TASK: Analyze this goal against SMART criteria and provide actionable feedback.

RESPONSE FORMAT - Return JSON only:
{
  "specific": {
    "score": 1-10,
    "feedback": "Brief assessment of how specific this goal is",
    "suggestions": ["specific improvement suggestion 1", "suggestion 2"] // only if score < 8
  },
  "measurable": {
    "score": 1-10,
    "feedback": "Brief assessment of measurability", 
    "suggestions": ["measurement improvement suggestion"] // only if score < 8
  },
  "achievable": {
    "score": 1-10,
    "feedback": "Brief assessment of achievability",
    "suggestions": ["achievability improvement"] // only if score < 8
  },
  "relevant": {
    "score": 1-10,
    "feedback": "Brief assessment of relevance to their life element",
    "suggestions": ["relevance improvement"] // only if score < 8
  },
  "timeBound": {
    "score": 1-10,
    "feedback": "Brief assessment of time-bound nature",
    "suggestions": ["time-bound improvement"] // only if score < 8
  },
  "overallScore": 1-10, // average of all scores
  "overallFeedback": "Overall assessment of goal quality",
  "recommendations": ["Top 2-3 most important improvements to make this goal more effective"]
}

SCORING GUIDE:
- 9-10: Excellent, meets SMART criteria fully
- 7-8: Good, minor improvements needed
- 5-6: Fair, some improvements needed  
- 3-4: Poor, significant improvements needed
- 1-2: Very poor, major restructuring needed

FEEDBACK TONE: Professional, constructive, encouraging - like a business coach helping optimize for success.

EXAMPLE GOOD GOALS:
- "Complete one 30-minute family walk every Tuesday and Thursday evening for the next 8 weeks"
- "Negotiate working from home on Fridays starting next month"
- "Attend one professional development webinar per month for Q1 2025"

FOCUS ON: Making goals concrete, measurable, and actionable while maintaining their strategic intent.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional goal-setting consultant. Provide constructive SMART goal analysis. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const smartAnalysis: SMARTAnalysis = JSON.parse(openAIData.choices[0].message.content);

    console.log('[SMART-VALIDATION] ✅ Goal validation completed, overall score:', smartAnalysis.overallScore);

    return new Response(JSON.stringify({
      success: true,
      data: smartAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SMART-VALIDATION] ❌ Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback_analysis: {
        specific: { score: 6, feedback: "Goal needs more specific details about what exactly will be accomplished." },
        measurable: { score: 5, feedback: "Consider adding measurable metrics or milestones." },
        achievable: { score: 7, feedback: "Goal appears achievable with proper planning." },
        relevant: { score: 8, feedback: "Goal aligns well with your selected life element." },
        timeBound: { score: 6, feedback: "Consider adding more specific deadlines or milestones." },
        overallScore: 6.4,
        overallFeedback: "This goal has good potential but could benefit from more specific and measurable elements.",
        recommendations: [
          "Add specific metrics or quantities to measure progress",
          "Include more detailed timeline or milestones",
          "Clarify exactly what success looks like"
        ]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});