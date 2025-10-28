import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SixElementsData {
  work_current: number;
  work_ideal: number;
  work_importance: number;
  sleep_current: number;
  sleep_ideal: number;
  sleep_importance: number;
  family_current: number;
  family_ideal: number;
  family_importance: number;
  health_current: number;
  health_ideal: number;
  health_importance: number;
  personal_current: number;
  personal_ideal: number;
  personal_importance: number;
  spiritual_current: number;
  spiritual_ideal: number;
  spiritual_importance: number;
}

interface WorkHappinessData {
  impact_current: number;
  impact_desired: number;
  fun_current: number;
  fun_desired: number;
  money_current: number;
  money_desired: number;
  remote_current: number;
  remote_desired: number;
}

interface GoalSuggestion {
  title: string;
  rationale: string;
  element: string;
  compound_benefit: string;
  suggestion_type: string;
}

interface SuggestionResponse {
  insights: {
    primaryPattern: string;
    opportunityArea: string;
  };
  suggestions: GoalSuggestion[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sixElementsData, workHappinessData, userEmail }: {
      sixElementsData: SixElementsData;
      workHappinessData: WorkHappinessData;
      userEmail: string;
    } = await req.json();

    console.log('[STRATEGIC-SUGGESTIONS] Generating suggestions for user:', userEmail);

    // Create sophisticated AI prompt with user's actual data
    const prompt = `You are Dan Lynn, a strategic life consultant with 30 years of experience helping executives and entrepreneurs optimize their life architecture using the proprietary 6 Elements of Life™ Framework and Business Happiness Formula.

ANALYSIS DATA:
User's 6 Elements Allocation:
- Work: Current ${sixElementsData.work_current}hrs/week, Ideal ${sixElementsData.work_ideal}hrs, Importance ${sixElementsData.work_importance}/10
- Sleep: Current ${sixElementsData.sleep_current}hrs/week, Ideal ${sixElementsData.sleep_ideal}hrs, Importance ${sixElementsData.sleep_importance}/10  
- Friends & Family: Current ${sixElementsData.family_current}hrs/week, Ideal ${sixElementsData.family_ideal}hrs, Importance ${sixElementsData.family_importance}/10
- Health & Fitness: Current ${sixElementsData.health_current}hrs/week, Ideal ${sixElementsData.health_ideal}hrs, Importance ${sixElementsData.health_importance}/10
- Personal Development: Current ${sixElementsData.personal_current}hrs/week, Ideal ${sixElementsData.personal_ideal}hrs, Importance ${sixElementsData.personal_importance}/10
- Spiritual: Current ${sixElementsData.spiritual_current}hrs/week, Ideal ${sixElementsData.spiritual_ideal}hrs, Importance ${sixElementsData.spiritual_importance}/10

Business Happiness Formula (Work Element):
- Impact: Current ${workHappinessData.impact_current}/10, Desired ${workHappinessData.impact_desired}/10
- Fun: Current ${workHappinessData.fun_current}/10, Desired ${workHappinessData.fun_desired}/10  
- Money: Current ${workHappinessData.money_current}/10, Desired ${workHappinessData.money_desired}/10
- Remote Work: Current ${workHappinessData.remote_current}/10, Desired ${workHappinessData.remote_desired}/10

TASK: Provide exactly 3 strategic goal suggestions that address their biggest gaps and constraints.

RESPONSE FORMAT - Return JSON only:
{
  "insights": {
    "primaryPattern": "One sentence identifying their main life architecture challenge",
    "opportunityArea": "The biggest strategic opportunity you see"
  },
  "suggestions": [
    {
      "title": "Goal Title (specific and actionable)",
      "rationale": "I notice that [specific insight about their data]. This goal addresses [strategic reasoning].",
      "element": "Primary element this goal serves",
      "compound_benefit": "How this goal also helps other elements",
      "suggestion_type": "efficiency_gain|compound_solution|boundary_setting|career_optimization|life_transition|systems_habits"
    },
    {
      "title": "Goal Title 2",
      "rationale": "Analysis and strategic reasoning...",
      "element": "Primary element",
      "compound_benefit": "Cross-element benefits",  
      "suggestion_type": "category"
    },
    {
      "title": "Goal Title 3", 
      "rationale": "Analysis and strategic reasoning...",
      "element": "Primary element",
      "compound_benefit": "Cross-element benefits",
      "suggestion_type": "category"
    }
  ]
}

GOAL TITLE REQUIREMENTS:
- Must be specific enough to become a trackable goal
- Should start with action verbs
- Must be achievable within 3-6 months
- Should address root constraints, not just symptoms

EXAMPLES OF GOOD GOAL TITLES:
- "Negotiate one work-from-home day per week"
- "Establish 30-minute morning reflection routine"  
- "Create family fitness activity 2x per week"
- "Join or lead one high-impact project at work"
- "Block 2 hours of protected learning time on Sundays"

STRATEGIC PRINCIPLES:
1. Address the biggest gaps first
2. Look for compound solutions that serve multiple elements
3. Consider their constraints (time, energy, life stage)
4. Focus on systems and boundaries rather than just adding activities
5. Make suggestions that are realistic for their current situation

TONE: Professional, insightful, strategic - like a trusted advisor who deeply understands their situation.`;

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
            content: 'You are Dan Lynn, a strategic life consultant with 30 years of experience. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const suggestionResponse: SuggestionResponse = JSON.parse(openAIData.choices[0].message.content);

    console.log('[STRATEGIC-SUGGESTIONS] ✅ Generated suggestions successfully');

    return new Response(JSON.stringify({
      success: true,
      data: suggestionResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[STRATEGIC-SUGGESTIONS] ❌ Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback_suggestions: {
        insights: {
          primaryPattern: "Based on your assessment, there are opportunities to optimize your life architecture.",
          opportunityArea: "Focus on creating better balance between your high-priority elements."
        },
        suggestions: [
          {
            title: "Establish weekly planning routine",
            rationale: "Regular planning helps align your time with your priorities across all life elements.",
            element: "Personal Development",
            compound_benefit: "Better planning improves efficiency in all other elements",
            suggestion_type: "systems_habits"
          },
          {
            title: "Create protected time for your highest-priority element",
            rationale: "Defending time for what matters most ensures progress on your most important goals.",
            element: "Multiple",
            compound_benefit: "Reduces stress and increases satisfaction across life areas",
            suggestion_type: "boundary_setting"
          },
          {
            title: "Identify one efficiency improvement in your daily routine",
            rationale: "Small optimizations can free up time for elements that need more attention.",
            element: "Multiple",
            compound_benefit: "More time becomes available for under-served priorities",
            suggestion_type: "efficiency_gain"
          }
        ]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});